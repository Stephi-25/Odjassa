const db = require('../config/database');

/**
 * Creates a new product in the database.
 * @param {object} productData - Contains all product details.
 * productData should include: name, price, vendor_id.
 * Optional: description, sku, stock_quantity, category_id, images, tags, status.
 * @returns {Promise<object>} The created product object.
 */
const create = async (productData) => {
  const {
    name,
    description = null,
    price,
    sku = null,
    stock_quantity = 0,
    vendor_id, // This MUST be provided, typically from req.user.id
    category_id = null,
    images = null, // Should be JSONB, e.g., ['url1', 'url2'] or [{url: '', alt: ''}]
    tags = null, // Should be TEXT[]
    status = 'pending_approval', // Default status
  } = productData;

  // Validate required fields that must come from the controller logic
  if (!name || price === undefined || vendor_id === undefined) {
    throw new Error('Missing required fields (name, price, vendor_id) for product creation in model.');
  }

  const queryText = `
    INSERT INTO products
      (name, description, price, sku, stock_quantity, vendor_id, category_id, images, tags, status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;
  // RETURNING * will return all columns of the newly inserted row.
  // Adjust RETURNING clause if you want specific fields, e.g., RETURNING id, name, vendor_id;

  const values = [
    name, description, price, sku, stock_quantity, vendor_id,
    category_id, images, tags, status
  ];

  try {
    const { rows } = await db.query(queryText, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating product in model:', error.message);
    // Handle specific errors like foreign key violations if category_id is involved and invalid
    // Or unique constraint on SKU if it exists
    if (error.message.includes('products_sku_key')) {
        const err = new Error('Product SKU already exists.');
        err.statusCode = 409;
        throw err;
    }
    // Default error for other DB issues
    throw new Error('Could not create product in database.');
  }
};

/**
 * Finds a product by its ID.
 * @param {number} productId
 * @returns {Promise<object|null>} The product object if found, otherwise null.
 */
const findById = async (productId) => {
  const queryText = 'SELECT * FROM products WHERE id = $1;';
  try {
    const { rows } = await db.query(queryText, [productId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding product by ID in model:', error.message);
    throw new Error('Could not retrieve product by ID from database.');
  }
};

/**
 * Finds all products, optionally filtered and paginated.
 * @param {object} filters - Optional filters (e.g., vendor_id, category_id, status).
 * @param {object} pagination - Optional pagination (e.g., limit, offset).
 * @returns {Promise<Array<object>>} An array of product objects.
 */
const findAll = async (filters = {}, pagination = { limit: 10, offset: 0 }) => {
  let queryText = 'SELECT * FROM products';
  const values = [];
  const conditions = [];
  let paramCount = 1;

  if (filters.vendor_id) {
    conditions.push(`vendor_id = $${paramCount++}`);
    values.push(filters.vendor_id);
  }
  if (filters.category_id) {
    conditions.push(`category_id = $${paramCount++}`);
    values.push(filters.category_id);
  }
  if (filters.status) {
    conditions.push(`status = $${paramCount++}`);
    values.push(filters.status);
  }
  // Add more filters as needed (e.g., price range, search term on name/description)
  if(filters.searchTerm) {
    conditions.push(`(name ILIKE $${paramCount++} OR description ILIKE $${paramCount-1})`); // Use same param index for OR
    values.push(`%${filters.searchTerm}%`);
  }


  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ` ORDER BY created_at DESC`; // Default ordering

  // Add pagination
  queryText += ` LIMIT $${paramCount++}`;
  values.push(pagination.limit);
  queryText += ` OFFSET $${paramCount++}`;
  values.push(pagination.offset);

  queryText += ';';

  try {
    // console.log('Executing findAll query:', queryText, values); // For debugging
    const { rows } = await db.query(queryText, values);
    return rows;
  } catch (error) {
    console.error('Error finding all products in model:', error.message);
    throw new Error('Could not retrieve products from database.');
  }
};

/**
 * Updates a product by its ID.
 * @param {number} productId
 * @param {object} productData - Fields to update.
 * @returns {Promise<object|null>} The updated product object, or null if not found.
 */
const update = async (productId, productData) => {
  // Build the SET part of the query dynamically based on provided productData
  const fields = [];
  const values = [];
  let paramCount = 1;

  for (const [key, value] of Object.entries(productData)) {
    // Ensure only valid columns are updated (important for security and correctness)
    // This list should match columns in 'products' table that are updatable
    const allowedFields = ['name', 'description', 'price', 'sku', 'stock_quantity', 'category_id', 'images', 'tags', 'status'];
    if (allowedFields.includes(key) && value !== undefined) { // value !== undefined allows setting null
      fields.push(`${key} = $${paramCount++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    // If productData is empty or contains no updatable fields
    throw new Error('No valid fields provided for update.');
  }

  // Add updated_at manually, or rely on the DB trigger if it's set for every field update
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(productId); // Add productId for the WHERE clause

  const queryText = `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *;
  `;

  try {
    const { rows } = await db.query(queryText, values);
    return rows[0] || null; // Return updated product or null if ID not found
  } catch (error) {
    console.error('Error updating product in model:', error.message);
     if (error.message.includes('products_sku_key')) {
        const err = new Error('Product SKU already exists.');
        err.statusCode = 409;
        throw err;
    }
    throw new Error('Could not update product in database.');
  }
};

/**
 * Removes a product by its ID (hard delete).
 * @param {number} productId
 * @returns {Promise<object|null>} The deleted product object, or null if not found.
 */
const remove = async (productId) => {
  const queryText = 'DELETE FROM products WHERE id = $1 RETURNING *;';
  try {
    const { rows } = await db.query(queryText, [productId]);
    return rows[0] || null; // Returns the deleted product or null if ID not found
  } catch (error) {
    console.error('Error removing product in model:', error.message);
    throw new Error('Could not remove product from database.');
  }
};

// TODO: Consider adding functions for soft delete and restore if needed later.
// const softDelete = async (productId) => { ... update status to 'deleted' ... }

module.exports = {
  create,
  findById,
  findAll,
  update,
  remove,
};
