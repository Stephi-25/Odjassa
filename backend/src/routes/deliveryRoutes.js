const express = require('express');
const deliveryController = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All delivery routes require user to be authenticated and have 'delivery_person' role.
router.use(protect);
router.use(authorize('delivery_person'));

/**
 * @route   GET /api/v1/delivery/available
 * @desc    Get orders available for pickup by delivery personnel.
 * @access  Private (delivery_person only)
 */
router.get('/available', deliveryController.getAvailableOrders);

/**
 * @route   GET /api/v1/delivery/my-orders
 * @desc    Get orders assigned to the currently logged-in delivery person.
 * @access  Private (delivery_person only)
 */
router.get('/my-orders', deliveryController.getMyAssignedOrders);

/**
 * @route   PATCH /api/v1/delivery/orders/:orderId/claim
 * @desc    Allows a delivery person to claim an available order.
 * @access  Private (delivery_person only)
 */
router.patch('/orders/:orderId/claim', deliveryController.claimOrderForDelivery);

/**
 * @route   PATCH /api/v1/delivery/orders/:orderId/status
 * @desc    Allows a delivery person to update the status of an order assigned to them.
 * @access  Private (delivery_person only)
 */
router.patch('/orders/:orderId/status', deliveryController.updateOrderStatusByDeliveryPerson);

module.exports = router;
