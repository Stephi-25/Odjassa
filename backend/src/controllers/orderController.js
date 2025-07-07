const orderModel = require('../models/orderModel');
const orderItemModel = require('../models/orderItemModel');
const productModel = require('../models/productModel'); // To check stock and get product details
const db = require('../config/database'); // For transactions

/**
 * Validates the input for creating an order.
 * @param {object} body - The request body.
 * @returns {Array<string>} An array of error messages, empty if valid.
 */
const validateCreateOrderInput = (body) => {
  const errors = [];
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    errors.push('Order must contain at least one item.');
  } else {
    body.items.forEach((item, index) => {
      if (!item.product_id || isNaN(parseInt(item.product_id))) {
        errors.push(`Item ${index + 1}: product_id is required and must be a number.`);
      }
      if (!item.quantity || isNaN(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
        errors.push(`Item ${index + 1}: quantity is required and must be a positive integer.`);
      }
    });
  }
  if (!body.shipping_address) {
    errors.push('Shipping address is required.');
  } else {
    // Basic check for shipping_address structure (can be more detailed)
    if (typeof body.shipping_address !== 'object' || !body.shipping_address.street || !body.shipping_address.city || !body.shipping_address.postal_code || !body.shipping_address.country) {
        errors.push('Shipping address must be an object with at least street, city, postal_code, and country.');
    }
  }
  // Add more validations: payment_method, currency if not default etc.
  return errors;
};


/**
 * Create a new order.
 * Handles stock checking, transaction management.
 */
const createOrder = async (req, res, next) => {
  const validationErrors = validateCreateOrderInput(req.body);
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join(' '));
    error.statusCode = 400;
    return next(error);
  }

  const {
    items, // Array of { product_id, quantity }
    shipping_address,
    billing_address,
    payment_method,
    // payment_status will default to 'pending' or be set after payment processing
    shipping_method,
    shipping_cost = 0,
    notes_to_vendor,
    currency = 'USD' // Default or from request
  } = req.body;

  const user_id = req.user.id; // From protect middleware

  const client = await db.pool.connect(); // Get a client from the pool for transaction

  try {
    await client.query('BEGIN'); // Start transaction

    let calculatedTotalAmount = 0;
    const orderItemsData = [];

    // 1. Validate products, check stock, calculate total, and prepare order_items
    for (const item of items) {
      const product = await productModel.findById(item.product_id); // Using existing model, not client.query
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found.`);
      }
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Not enough stock for product: ${product.name} (ID: ${item.product_id}). Available: ${product.stock_quantity}, Requested: ${item.quantity}.`);
      }
      if (product.status !== 'active') {
        throw new Error(`Product: ${product.name} (ID: ${item.product_id}) is not currently available for purchase.`);
      }

      calculatedTotalAmount += product.price * item.quantity;

      orderItemsData.push({
        // order_id will be set after order is created
        product_id: product.id,
        vendor_id: product.vendor_id, // Assuming product model returns vendor_id
        quantity: item.quantity,
        price_at_purchase: product.price,
        product_name: product.name,
        product_sku: product.sku,
        product_image_url: product.images ? product.images[0] : null, // Assuming first image is main
      });
    }

    // Add shipping cost to total if applicable
    calculatedTotalAmount += parseFloat(shipping_cost) || 0;


    // 2. Create the order entry
    const orderData = {
      user_id,
      total_amount: calculatedTotalAmount,
      shipping_address,
      billing_address,
      payment_method,
      // payment_status: 'pending', // Default, or set based on pre-auth if any
      shipping_method,
      shipping_cost: parseFloat(shipping_cost) || 0,
      notes_to_vendor,
      currency,
      status: 'pending_payment', // Initial status
    };
    // Use client.query for operations within the transaction
    const orderInsertQuery = `
      INSERT INTO orders (user_id, total_amount, shipping_address, billing_address, payment_method, payment_status, shipping_method, shipping_cost, notes_to_vendor, currency, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
    `;
    const orderInsertValues = [
        user_id, orderData.total_amount, orderData.shipping_address, orderData.billing_address,
        orderData.payment_method, 'pending', orderData.shipping_method, orderData.shipping_cost,
        orderData.notes_to_vendor, orderData.currency, orderData.status
    ];
    const { rows: [newOrder] } = await client.query(orderInsertQuery, orderInsertValues);


    // 3. Create order items and link them to the new order
    const finalOrderItemsData = orderItemsData.map(item => ({ ...item, order_id: newOrder.id }));

    // Using orderItemModel.createBulk but adapted for client.query
    if (finalOrderItemsData.length > 0) {
        const itemRows = [];
        const allItemValues = [];
        let itemParamCount = 1;
        for (const item of finalOrderItemsData) {
            const valuePlaceholders = [];
            for (let i = 0; i < 9; i++) { valuePlaceholders.push(`$${itemParamCount++}`); } // 9 fields
            itemRows.push(`(${valuePlaceholders.join(', ')})`);
            allItemValues.push(item.order_id, item.product_id, item.vendor_id, item.quantity, item.price_at_purchase, item.product_name, item.product_sku, item.product_image_url, 'pending');
        }
        const orderItemsInsertQuery = `
            INSERT INTO order_items (order_id, product_id, vendor_id, quantity, price_at_purchase, product_name, product_sku, product_image_url, item_status)
            VALUES ${itemRows.join(', ')} RETURNING *;
        `;
        await client.query(orderItemsInsertQuery, allItemValues);
    }


    // 4. Decrement stock for each product
    for (const item of finalOrderItemsData) {
      const newStock = (await productModel.findById(item.product_id)).stock_quantity - item.quantity; // Fetch fresh stock before update
      // Use client.query for stock update
      await client.query('UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStock, item.product_id]);
    }

    await client.query('COMMIT'); // Commit transaction

    // Fetch the full order details to return (order + items)
    const createdOrderWithItems = await orderModel.findById(newOrder.id); // Using regular model function
    const orderItemsResult = await orderItemModel.findByOrderId(newOrder.id); // Using regular model function

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully.',
      data: {
        order: createdOrderWithItems,
        items: orderItemsResult
      },
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback transaction on error
    // Add more specific error handling (e.g., stock issue vs. payment issue)
    if (!error.statusCode) error.statusCode = 500; // Default to 500 if not set
    if (error.message.includes("Not enough stock") || error.message.includes("not found")) {
        error.statusCode = 400; // Bad request if product issue
    }
    next(error);
  } finally {
    client.release(); // Release client back to the pool
  }
};


/**
 * Get all orders for the authenticated user.
 */
const getUserOrders = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { limit = 10, page = 1 } = req.query;
    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    };

    const orders = await orderModel.findByUserId(user_id, pagination);
    // TODO: Could also fetch total count for pagination metadata.

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get details of a specific order.
 * Accessible by the order owner, or an admin/vendor (vendor if one of their products is in the order).
 */
const getOrderDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (isNaN(parseInt(orderId))) {
        const error = new Error('Invalid order ID format.');
        error.statusCode = 400;
        throw error;
    }

    const order = await orderModel.findById(parseInt(orderId));
    if (!order) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Authorization: User must be owner, or admin.
    // Vendor access to specific orders can be more complex (e.g., if they have items in that order).
    // For now, only owner and admin.
    if (order.user_id !== req.user.id && req.user.role !== 'admin') {
      const error = new Error('You are not authorized to view this order.');
      error.statusCode = 403; // Forbidden
      return next(error);
    }

    const items = await orderItemModel.findByOrderId(order.id);

    res.status(200).json({
      status: 'success',
      data: {
        order,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Placeholder for updating order status (e.g., by admin or vendor)
// const updateOrderStatus = async (req, res, next) => { ... }


module.exports = {
  createOrder,
  getUserOrders,
  getOrderDetails,
  // updateOrderStatus,
};
