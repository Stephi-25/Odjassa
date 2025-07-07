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

module.exports = {
  moderateProduct,
  // ... other admin controller functions
};
