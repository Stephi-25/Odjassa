const productModel = require('../models/productModel');

/**
 * Moderates a product by updating its status and optionally adding moderation notes.
 * Accessible only by users with 'admin' role.
 */
const moderateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status, moderation_notes } = req.body; // moderation_notes is optional

    // Validate productId
    if (isNaN(parseInt(productId))) {
      const error = new Error('Invalid product ID format.');
      error.statusCode = 400;
      throw error;
    }

    // Validate status
    const allowedStatuses = ['active', 'rejected', 'pending_approval', 'inactive']; // Define allowed statuses
    if (!status || !allowedStatuses.includes(status)) {
      const error = new Error(`Invalid status value. Must be one of: ${allowedStatuses.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    // Check if product exists (optional, as model update will return null if not found)
    const existingProduct = await productModel.findById(parseInt(productId));
    if (!existingProduct) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      return next(error);
    }

    // The role check for 'admin' should be handled by middleware (authorize('admin'))
    // before this controller function is even called.

    const updatedProduct = await productModel.updateStatus(parseInt(productId), status, moderation_notes);

    if (!updatedProduct) {
      // This case should ideally be caught by the findById check above,
      // but as a fallback if something went wrong during update.
      const error = new Error('Product not found or failed to update status.');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      message: `Product status updated to '${status}'.`,
      data: { product: updatedProduct },
    });

  } catch (error) {
    // Pass error to the global error handler
    next(error);
  }
};


// Placeholder for other admin-specific controller functions:
// - Get all users
// - Update user roles
// - View site analytics (later phase)
// - Manage categories


/**
 * Updates the status of an order and related fields.
 * Accessible only by users with 'admin' role.
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const {
      status, // Main order status
      payment_status,
      transaction_id,
      tracking_number,
      delivered_at
      // Potentially other fields like internal_notes for admin
    } = req.body;

    if (isNaN(parseInt(orderId))) {
      const error = new Error('Invalid order ID format.');
      error.statusCode = 400;
      throw error;
    }

    // Validate main order status if provided
    if (status !== undefined) {
      const allowedOrderStatuses = [
        'pending_payment', 'processing', 'awaiting_shipment', 'shipped',
        'delivered', 'completed', 'cancelled', 'refunded', 'failed'
      ];
      if (!allowedOrderStatuses.includes(status)) {
        const error = new Error(`Invalid order status value. Must be one of: ${allowedOrderStatuses.join(', ')}.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate payment status if provided
    if (payment_status !== undefined) {
        const allowedPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        if (!allowedPaymentStatuses.includes(payment_status)) {
            const error = new Error(`Invalid payment status value. Must be one of: ${allowedPaymentStatuses.join(', ')}.`);
            error.statusCode = 400;
            throw error;
        }
    }

    // Ensure at least one updatable field is provided (status or one of the additional fields)
    if (status === undefined && payment_status === undefined && transaction_id === undefined && tracking_number === undefined && delivered_at === undefined) {
        const error = new Error('No valid fields provided for update. Please provide at least an order status or other updatable order fields.');
        error.statusCode = 400;
        throw error;
    }

    const existingOrder = await orderModel.findById(parseInt(orderId));
    if (!existingOrder) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      return next(error);
    }

    const additionalUpdates = {};
    if (payment_status !== undefined) additionalUpdates.payment_status = payment_status;
    if (transaction_id !== undefined) additionalUpdates.transaction_id = transaction_id; // Use null to clear
    if (tracking_number !== undefined) additionalUpdates.tracking_number = tracking_number; // Use null to clear
    if (delivered_at !== undefined) additionalUpdates.delivered_at = delivered_at; // Use null to clear

    // Use the existing status if a new main status is not provided but other fields are
    const newStatus = status !== undefined ? status : existingOrder.status;

    const updatedOrder = await orderModel.updateStatus(parseInt(orderId), newStatus, additionalUpdates);

    if (!updatedOrder) {
      const error = new Error('Order not found or failed to update status.');
      error.statusCode = 404; // Or 500 if it's an unexpected failure
      return next(error);
    }

    // TODO: Potentially trigger notifications here (e.g., order shipped, order delivered)

    res.status(200).json({
      status: 'success',
      message: `Order ${updatedOrder.id} updated successfully.`,
      data: { order: updatedOrder },
    });

  } catch (error) {
    if (!error.statusCode && error.message && error.message.includes('Transaction ID') && error.message.includes('already exists')) {
        error.statusCode = 409; // Conflict for unique transaction_id
    }
    next(error);
  }
};


module.exports = {
  moderateProduct,
  updateOrderStatus,
  // ... other admin controller functions
};
