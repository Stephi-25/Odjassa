const db = require('../config/database'); // Uses the pool from database.js

/**
 * Creates a new user in the database.
 * @param {string} username
 * @param {string} email
 * @param {string} passwordHash - Already hashed password
 * @param {string} role - e.g., 'customer', 'vendor'
 * @returns {Promise<object>} The created user object (without password_hash).
 */
const createUser = async (username, email, passwordHash, role = 'customer', firstName = null, lastName = null) => {
  const queryText = `
    INSERT INTO users (username, email, password_hash, role, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, username, email, role, first_name, last_name, created_at, updated_at;
  `;
  const values = [username, email, passwordHash, role, firstName, lastName];
  try {
    const { rows } = await db.query(queryText, values);
    return rows[0];
  } catch (error) {
    // Handle specific errors, e.g., unique constraint violation
    if (error.message.includes('duplicate key value violates unique constraint "users_username_key"')) {
      const err = new Error('Username already exists.');
      err.statusCode = 409; // Conflict
      throw err;
    }
    if (error.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
      const err = new Error('Email already exists.');
      err.statusCode = 409; // Conflict
      throw err;
    }
    console.error('Error creating user in model:', error.message);
    throw new Error('Could not create user.'); // Generic error for other DB issues
  }
};

/**
 * Finds a user by their email address.
 * @param {string} email
 * @returns {Promise<object|null>} The user object if found, otherwise null. Includes password_hash.
 */
const findUserByEmail = async (email) => {
  const queryText = 'SELECT * FROM users WHERE email = $1;';
  try {
    const { rows } = await db.query(queryText, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email in model:', error.message);
    throw new Error('Could not retrieve user by email.');
  }
};

/**
 * Finds a user by their ID.
 * @param {number} id
 * @returns {Promise<object|null>} The user object if found (without password_hash), otherwise null.
 */
const findUserById = async (id) => {
  const queryText = 'SELECT id, username, email, role, first_name, last_name, created_at, updated_at, profile_picture_url, phone_number, address, email_verified, is_active, last_login FROM users WHERE id = $1;';
  try {
    const { rows } = await db.query(queryText, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID in model:', error.message);
    throw new Error('Could not retrieve user by ID.');
  }
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
