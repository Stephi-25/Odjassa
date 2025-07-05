const express = require('express');
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Public Routes ---
/**
 * @route   GET /api/v1/products
 * @desc    Get all products (filtered, paginated). Publicly accessible (shows active products by default).
 * @access  Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get a single product by ID. Publicly accessible (details might be limited by status).
 * @access  Public
 */
router.get('/:id', productController.getProductById);


// --- Protected Routes ---

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product.
 * @access  Private (Vendor only)
 */
router.post(
  '/',
  protect, // Ensures user is logged in
  authorize('vendor'), // Ensures user has 'vendor' role
  productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update an existing product.
 * @access  Private (Product owner or Admin only - checked in controller)
 */
router.put(
  '/:id',
  protect, // Ensures user is logged in
  // Authorization (owner or admin) is handled within the controller for this route
  productController.updateProduct
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product.
 * @access  Private (Product owner or Admin only - checked in controller)
 */
router.delete(
  '/:id',
  protect, // Ensures user is logged in
  // Authorization (owner or admin) is handled within the controller for this route
  productController.deleteProduct
);


// --- Admin Specific Product Routes (Example - can be expanded) ---
// These might involve changing status directly, or managing all products.
// router.patch(
//   '/:id/status',
//   protect,
//   authorize('admin'), // Only admin can change status directly via this route
//   productController.updateProductStatus
//   // This would need a new controller function: updateProductStatus(req, res, next)
// );


module.exports = router;
