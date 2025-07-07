const db = require('../config/database');

/**
 * Creates a new order in the database.
 * @param {object} orderData - Contains order details.
 * Required: user_id, total_amount, shipping_address.
 * Optional: billing_address, payment_method, payment_status, transaction_id,
 *           shipping_method, shipping_cost, notes_to_vendor, currency, status.
 * @returns {Promise<object>} The created order object.
 */
const create = async (orderData) => {
  const {
    user_id,
    total_amount,
    shipping_address, // Should be a JSON object
    billing_address = null, // Should be a JSON object
    payment_method = null,
    payment_status = 'pending',
    transaction_id = null,
    shipping_method = null,
    shipping_cost = 0.00,
    notes_to_vendor = null,
    currency = 'USD', // Default currency
    status = 'pending_payment', // Default status
    estimated_delivery_date = null,
    // tracking_number and delivered_at are usually set later
  } = orderData;

  if (user_id === undefined || total_amount === undefined || !shipping_address) {
    throw new Error('Missing required fields (user_id, total_amount, shipping_address) for order creation in model.');
  }

  const queryText = `
    INSERT INTO orders (
      user_id, total_amount, shipping_address, billing_address, payment_method,
      payment_status, transaction_id, shipping_method, shipping_cost,
      notes_to_vendor, currency, status, estimated_delivery_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `;
  const values = [
    user_id, parseFloat(total_amount), shipping_address, billing_address, payment_method,
    payment_status, transaction_id, shipping_method, parseFloat(shipping_cost),
    notes_to_vendor, currency, status, estimated_delivery_date
  ];

  try {
    const { rows } = await db.query(queryText, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating order in model:', error.message);
    if (error.message.includes('orders_transaction_id_key') && transaction_id) {
        const err = new Error(`Transaction ID '${transaction_id}' already exists.`);
        err.statusCode = 409; // Conflict
        throw err;
    }
    throw new Error('Could not create order in database.');
  }
};

/**
 * Finds an order by its ID.
 * @param {number} orderId
 * @returns {Promise<object|null>} The order object if found, otherwise null.
 */
const findById = async (orderId) => {
  const queryText = 'SELECT * FROM orders WHERE id = $1;';
  try {
    const { rows } = await db.query(queryText, [orderId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding order by ID in model:', error.message);
    throw new Error('Could not retrieve order by ID from database.');
  }
};

/**
 * Finds all orders for a specific user, with pagination.
 * @param {number} userId
 * @param {object} pagination - { limit = 10, offset = 0 }
 * @returns {Promise<Array<object>>} An array of order objects.
 */
const findByUserId = async (userId, pagination = { limit: 10, offset: 0 }) => {
  const queryText = `
    SELECT * FROM orders
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const values = [userId, pagination.limit, pagination.offset];
  try {
    const { rows } = await db.query(queryText, values);
    return rows;
  } catch (error) {
    console.error('Error finding orders by user ID in model:', error.message);
    throw new Error('Could not retrieve orders for user from database.');
  }
};

/**
 * Updates the status of an order.
 * @param {number} orderId
 * @param {string} status - The new status.
 * @param {object} additionalUpdates - Optional fields like payment_status, transaction_id, tracking_number, delivered_at etc.
 * @returns {Promise<object|null>} The updated order object, or null if not found.
 */
const updateStatus = async (orderId, status, additionalUpdates = {}) => {
  const baseQuery = 'UPDATE orders SET status = $1';
  const values = [status];
  let paramCount = 2;
  const setClauses = [];

  if (additionalUpdates.payment_status) {
    setClauses.push(`payment_status = $${paramCount++}`);
    values.push(additionalUpdates.payment_status);
  }
  if (additionalUpdates.transaction_id) {
    setClauses.push(`transaction_id = $${paramCount++}`);
    values.push(additionalUpdates.transaction_id);
  }
  if (additionalUpdates.tracking_number) {
    setClauses.push(`tracking_number = $${paramCount++}`);
    values.push(additionalUpdates.tracking_number);
  }
  if (additionalUpdates.delivered_at) {
    setClauses.push(`delivered_at = $${paramCount++}`);
    values.push(additionalUpdates.delivered_at);
  }
  // Add other updatable fields as needed

  let queryText = baseQuery;
  if (setClauses.length > 0) {
    queryText += ', ' + setClauses.join(', ');
  }
  queryText += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *;`;
  values.push(orderId);

  try {
    const { rows } = await db.query(queryText, values);
    return rows[0] || null;
  } catch (error) {
    console.error('Error updating order status in model:', error.message);
    if (error.message.includes('orders_transaction_id_key') && additionalUpdates.transaction_id) {
        const err = new Error(`Transaction ID '${additionalUpdates.transaction_id}' already exists.`);
        err.statusCode = 409; // Conflict
        throw err;
    }
    throw new Error('Could not update order status in database.');
  }
};

// TODO: Add functions for more complex queries if needed, e.g., find by status, date range, etc.
// Or for admin/vendor views of orders.

/**
 * Assigns a delivery person to an order and updates its status.
 * @param {number} orderId
 * @param {number} deliveryPersonId
 * @param {string} newStatus - e.g., 'awaiting_pickup'
 * @returns {Promise<object|null>} The updated order object, or null if not found.
 */
const assignDeliveryPerson = async (orderId, deliveryPersonId, newStatus = 'awaiting_pickup') => {
  const queryText = `
    UPDATE orders
    SET delivery_person_id = $1, status = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;
  const values = [deliveryPersonId, newStatus, orderId];
  try {
    const { rows } = await db.query(queryText, values);
    return rows[0] || null;
  } catch (error) {
    console.error('Error assigning delivery person in model:', error.message);
    throw new Error('Could not assign delivery person to order.');
  }
};

/**
 * Finds orders that are ready for pickup and not yet assigned.
 * @param {object} pagination - { limit = 10, offset = 0 }
 * @returns {Promise<Array<object>>} An array of order objects.
 */
const findAvailableForPickup = async (pagination = { limit: 10, offset = 0 }) => {
  // Assumes 'ready_for_delivery' is the status for orders prepared by vendors/admin
  // and waiting for a delivery person to claim or be assigned.
  const queryText = `
    SELECT * FROM orders
    WHERE status = 'ready_for_delivery' AND delivery_person_id IS NULL
    ORDER BY created_at ASC -- Prioritize older orders
    LIMIT $1 OFFSET $2;
  `;
  const values = [pagination.limit, pagination.offset];
  try {
    const { rows } = await db.query(queryText, values);
    return rows;
  } catch (error) {
    console.error('Error finding available orders for pickup in model:', error.message);
    throw new Error('Could not retrieve available orders for pickup.');
  }
};

/**
 * Finds orders assigned to a specific delivery person.
 * @param {number} deliveryPersonId
 * @param {Array<string>} statusFilters - Optional array of statuses to filter by (e.g., ['awaiting_pickup', 'out_for_delivery'])
 * @param {object} pagination - { limit = 10, offset = 0 }
 * @returns {Promise<Array<object>>} An array of order objects.
 */
const findByDeliveryPersonId = async (deliveryPersonId, statusFilters = [], pagination = { limit: 10, offset = 0 }) => {
  let queryText = 'SELECT * FROM orders WHERE delivery_person_id = $1';
  const values = [deliveryPersonId];
  let paramCount = 2;

  if (statusFilters && statusFilters.length > 0) {
    // Create placeholders like $2, $3, etc. for each status in the IN clause
    const statusPlaceholders = statusFilters.map(() => `$${paramCount++}`).join(', ');
    queryText += ` AND status IN (${statusPlaceholders})`;
    values.push(...statusFilters);
  } else {
    // Default: Don't show already delivered, completed, failed, or cancelled orders unless specified
     queryText += ` AND status NOT IN ('delivered', 'completed', 'failed', 'cancelled', 'refunded')`;
  }

  queryText += ` ORDER BY created_at ASC LIMIT $${paramCount++} OFFSET $${paramCount++};`;
  values.push(pagination.limit, pagination.offset);

  try {
    const { rows } = await db.query(queryText, values);
    return rows;
  } catch (error) {
    console.error('Error finding orders by delivery person ID in model:', error.message);
    throw new Error('Could not retrieve orders for delivery person.');
  }
};


module.exports = {
  create,
  findById,
  findByUserId,
  updateStatus,
  assignDeliveryPerson,
  findAvailableForPickup,
  findByDeliveryPersonId,
};
