const orderModel = require('../models/orderModel');

const DELIVERY_ROLE = 'delivery_person'; // Define role string once

/**
 * Get orders available for pickup by any delivery person.
 * Filters for orders with status 'ready_for_delivery' and no delivery_person_id.
 */
const getAvailableOrders = async (req, res, next) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    };

    const availableOrders = await orderModel.findAvailableForPickup(pagination);

    res.status(200).json({
      status: 'success',
      results: availableOrders.length,
      data: { orders: availableOrders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get orders currently assigned to the logged-in delivery person.
 * Filters for relevant statuses (e.g., 'awaiting_pickup', 'out_for_delivery').
 */
const getMyAssignedOrders = async (req, res, next) => {
  try {
    const deliveryPersonId = req.user.id; // From protect middleware
    const { limit = 10, page = 1, status } = req.query; // Allow filtering by status query param

    const pagination = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    };

    // Define which statuses are relevant for "my active deliveries"
    // If a specific status is passed in query, use that. Otherwise, use defaults.
    const statusFilters = status ? status.split(',') : ['awaiting_pickup', 'out_for_delivery', 'delivery_attempted'];

    const assignedOrders = await orderModel.findByDeliveryPersonId(deliveryPersonId, statusFilters, pagination);

    res.status(200).json({
      status: 'success',
      results: assignedOrders.length,
      data: { orders: assignedOrders },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Allows a delivery person to claim an available order for delivery.
 * Sets delivery_person_id to self and updates order status (e.g., to 'awaiting_pickup').
 */
const claimOrderForDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.id; // From protect middleware

    if (isNaN(parseInt(orderId))) {
      const error = new Error('Invalid order ID format.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Check if the order exists and is available for pickup
    const orderToClaim = await orderModel.findById(parseInt(orderId));
    if (!orderToClaim) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      return next(error);
    }
    if (orderToClaim.status !== 'ready_for_delivery' || orderToClaim.delivery_person_id) {
      const error = new Error('Order is not available for pickup or is already assigned.');
      error.statusCode = 400; // Or 409 Conflict
      return next(error);
    }

    // 2. Assign the order to the current delivery person
    const newStatus = 'awaiting_pickup'; // Status after claiming
    const updatedOrder = await orderModel.assignDeliveryPerson(parseInt(orderId), deliveryPersonId, newStatus);

    if (!updatedOrder) {
        // Should not happen if previous checks passed, but as a safeguard
        const error = new Error('Failed to claim order. Please try again.');
        error.statusCode = 500;
        return next(error);
    }

    // TODO: Notify admin/vendor that order has been picked up by a delivery person? (Optional)

    res.status(200).json({
      status: 'success',
      message: `Order #${updatedOrder.id} successfully claimed for delivery.`,
      data: { order: updatedOrder },
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Allows a delivery person to update the status of an order assigned to them.
 * Permitted status transitions: e.g., 'awaiting_pickup' -> 'out_for_delivery' -> 'delivered'/'delivery_failed'.
 */
const updateOrderStatusByDeliveryPerson = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body; // 'notes' could be for delivery_failed reason, or proof of delivery notes
    const deliveryPersonId = req.user.id;

    if (isNaN(parseInt(orderId))) {
      const error = new Error('Invalid order ID format.');
      error.statusCode = 400;
      throw error;
    }

    // Validate the new status
    const allowedDeliveryStatuses = ['out_for_delivery', 'delivered', 'delivery_failed', 'delivery_attempted'];
    if (!status || !allowedDeliveryStatuses.includes(status)) {
      const error = new Error(`Invalid status. Allowed statuses for delivery update: ${allowedDeliveryStatuses.join(', ')}.`);
      error.statusCode = 400;
      throw error;
    }

    // 1. Fetch the order to verify it's assigned to this delivery person and current status allows update
    const orderToUpdate = await orderModel.findById(parseInt(orderId));
    if (!orderToUpdate) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      return next(error);
    }

    if (orderToUpdate.delivery_person_id !== deliveryPersonId) {
      const error = new Error('You are not authorized to update this order. It is not assigned to you.');
      error.statusCode = 403; // Forbidden
      return next(error);
    }

    // 2. Basic state machine for delivery statuses (can be more complex)
    // Example: Cannot go from 'awaiting_pickup' directly to 'delivered' without 'out_for_delivery'
    const currentStatus = orderToUpdate.status;
    const validTransitions = {
        'awaiting_pickup': ['out_for_delivery', 'delivery_failed'], // Can fail before even going out
        'out_for_delivery': ['delivered', 'delivery_failed', 'delivery_attempted'],
        'delivery_attempted': ['out_for_delivery', 'delivered', 'delivery_failed'], // Can re-attempt or mark as failed/delivered
        // 'delivered' and 'delivery_failed' are typically terminal for a delivery person.
    };

    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
        const error = new Error(`Invalid status transition from '${currentStatus}' to '${status}'.`);
        error.statusCode = 400;
        return next(error);
    }

    const additionalUpdates = {};
    if (status === 'delivered') {
        additionalUpdates.delivered_at = new Date(); // Set delivery timestamp
    }
    // If 'notes' are delivery notes, they might be stored in order.internal_notes or a new field.
    // For now, orderModel.updateStatus doesn't explicitly handle a 'notes' field in additionalUpdates.
    // If 'notes' are for 'delivery_failed', they could go into 'internal_notes' or 'orders.status_reason' (new field).
    // Let's assume for now 'notes' could be 'internal_notes' if adminController's updateOrderStatus is used,
    // or we'd need to enhance orderModel.updateStatus or add a specific field.
    // For MVP, just updating status and delivered_at.

    const updatedOrder = await orderModel.updateStatus(parseInt(orderId), status, additionalUpdates);

    if (!updatedOrder) {
      const error = new Error('Failed to update order status.');
      error.statusCode = 500; // Or 404 if update returned null meaning not found
      return next(error);
    }

    // TODO: Notify customer/admin of status change (e.g., 'out_for_delivery', 'delivered') via emailService

    res.status(200).json({
      status: 'success',
      message: `Order #${updatedOrder.id} status updated to '${status}'.`,
      data: { order: updatedOrder },
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAvailableOrders,
  getMyAssignedOrders,
  claimOrderForDelivery,
  updateOrderStatusByDeliveryPerson,
};
