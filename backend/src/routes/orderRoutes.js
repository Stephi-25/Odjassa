const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware'); // authorize might not be needed here if checks are in controller

const router = express.Router();

// All order routes require user to be authenticated
router.use(protect);

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new order
 * @access  Private (Authenticated user)
 */
router.post('/', orderController.createOrder);

/**
 * @route   GET /api/v1/orders
 * @desc    Get all orders for the logged-in user (paginated)
 * @access  Private (Authenticated user)
 */
router.get('/', orderController.getUserOrders);

/**
 * @route   GET /api/v1/orders/:orderId
 * @desc    Get details of a specific order
 * @access  Private (Order owner or Admin - checked in controller)
 */
router.get('/:orderId', orderController.getOrderDetails);


// --- Routes for Admin/Vendor to manage orders ---
// Example: Admin or Vendor updating order status
// This might be better placed in adminRoutes.js or vendorRoutes.js if they exist,
// or kept here with more specific role authorization.

// router.patch(
//   '/:orderId/status',
//   authorize('admin', 'vendor'), // Example: Admin or Vendor can update status
//   orderController.updateOrderStatus // Needs implementation in controller
// );

// router.get(
//   '/vendor', // Get all orders containing products from this vendor
//   authorize('vendor'),
//   orderController.getVendorSpecificOrders
// );


module.exports = router;
