const db = require('../config/database');

/**
 * Creates multiple order items in the database, typically within a transaction.
 * @param {Array<object>} itemsData - Array of item objects.
 * Each item object should include: order_id, product_id, vendor_id, quantity,
 * price_at_purchase, product_name, product_sku, product_image_url.
 * Optional: item_status.
 * @returns {Promise<Array<object>>} An array of the created order item objects.
 */
const createBulk = async (itemsData) => {
  if (!itemsData || itemsData.length === 0) {
    return []; // Or throw an error if items are mandatory for an order
  }

  // Construct the multi-row VALUES string for the INSERT query
  // ($1, $2, $3, ...), ($N, $N+1, $N+2, ...)
  const itemRows = [];
  const allValues = [];
  let paramCount = 1;

  for (const item of itemsData) {
    const {
      order_id,
      product_id,
      vendor_id,
      quantity,
      price_at_purchase,
      product_name,
      product_sku = null,
      product_image_url = null,
      item_status = 'pending', // Default status for an item
    } = item;

    if (order_id === undefined || product_id === undefined || vendor_id === undefined || quantity === undefined || price_at_purchase === undefined || !product_name) {
      throw new Error('Missing required fields for one or more order items in model (order_id, product_id, vendor_id, quantity, price_at_purchase, product_name).');
    }

    const valuePlaceholders = [];
    for (let i = 0; i < 9; i++) { // 9 fields to insert per item
        valuePlaceholders.push(`$${paramCount++}`);
    }
    itemRows.push(`(${valuePlaceholders.join(', ')})`);

    allValues.push(
        order_id, product_id, vendor_id, parseInt(quantity), parseFloat(price_at_purchase),
        product_name, product_sku, product_image_url, item_status
    );
  }

  const queryText = `
    INSERT INTO order_items (
      order_id, product_id, vendor_id, quantity, price_at_purchase,
      product_name, product_sku, product_image_url, item_status
    )
    VALUES ${itemRows.join(', ')}
    RETURNING *;
  `;

  try {
    const { rows } = await db.query(queryText, allValues);
    return rows;
  } catch (error) {
    console.error('Error creating bulk order items in model:', error.message);
    // Handle specific errors like unique constraint violation on (order_id, product_id)
    if (error.message.includes('unique_order_product_item')) {
        const err = new Error('Duplicate product item in order. Please adjust quantities.');
        err.statusCode = 409; // Conflict
        throw err;
    }
    throw new Error('Could not create order items in database.');
  }
};


/**
 * Finds all items for a specific order.
 * @param {number} orderId
 * @returns {Promise<Array<object>>} An array of order item objects.
 */
const findByOrderId = async (orderId) => {
  const queryText = 'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC;';
  try {
    const { rows } = await db.query(queryText, [orderId]);
    return rows;
  } catch (error) {
    console.error('Error finding order items by order ID in model:', error.message);
    throw new Error('Could not retrieve order items from database.');
  }
};

/**
 * Updates the status of a specific order item.
 * @param {number} orderItemId
 * @param {string} itemStatus - The new status for the item.
 * @returns {Promise<object|null>} The updated order item object, or null if not found.
 */
const updateItemStatus = async(orderItemId, itemStatus) => {
    const queryText = `
        UPDATE order_items
        SET item_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *;
    `;
    const values = [itemStatus, orderItemId];
    try {
        const { rows } = await db.query(queryText, values);
        return rows[0] || null;
    } catch (error) {
        console.error('Error updating order item status in model:', error.message);
        throw new Error('Could not update order item status in database.');
    }
};


// TODO: Add functions for finding items by vendor, product, etc., if needed for admin/vendor dashboards.

module.exports = {
  createBulk,
  findByOrderId,
  updateItemStatus,
};
