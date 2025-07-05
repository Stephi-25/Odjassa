const bcrypt = require('bcrypt'); // Mocked bcrypt
const jwt = require('jsonwebtoken'); // Mocked jsonwebtoken

const SALT_ROUNDS = 10; // Should match what's expected or configured if not using bcrypt's default

/**
 * Hashes a password using bcrypt.
 * @param {string} password The plain text password.
 * @returns {Promise<string>} The hashed password.
 */
const hashPassword = async (password) => {
  try {
    // In a real bcrypt, genSalt is often called implicitly by hash if saltOrRounds is a number.
    // Our mock might need explicit salt generation if hash mock expects a salt string.
    // const salt = await bcrypt.genSalt(SALT_ROUNDS);
    // const hashedPassword = await bcrypt.hash(password, salt);
    // Or, if bcrypt.hash can take rounds directly (as per many implementations):
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed.');
  }
};

/**
 * Compares a plain text password with a hashed password.
 * @param {string} plainPassword The plain text password.
 * @param {string} hashedPassword The hashed password from the database.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
const comparePasswords = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    // Avoid leaking information about why comparison failed in production
    // For example, don't say "hash format incorrect" or similar.
    // Simply indicate that comparison couldn't be performed or resulted in a non-match.
    return false; // Or throw a generic error
  }
};

/**
 * Generates a JSON Web Token (JWT).
 * @param {object} payload The payload to include in the token (e.g., userId, role).
 * @param {string} expiresIn (Optional) Token expiration time (e.g., '1h', '7d').
 * @returns {string} The generated JWT.
 */
const generateToken = (payload, expiresIn = '1h') => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined. Cannot generate token.');
    throw new Error('Token generation failed due to missing secret.');
  }
  try {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw new Error('Token generation failed.');
  }
};

/**
 * Verifies a JSON Web Token (JWT).
 * @param {string} token The JWT to verify.
 * @returns {Promise<object|null>} The decoded payload if verification is successful, otherwise null or throws error.
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined. Cannot verify token.');
    throw new Error('Token verification failed due to missing secret.');
  }
  try {
    // The mocked jwt.verify might be synchronous or asynchronous depending on its mock implementation.
    // Assuming it can be used synchronously or returns a promise that resolves/rejects.
    // For our mock, let's assume it's synchronous or we handle its async nature if needed.
    const decoded = jwt.verify(token, secret);
    return decoded; // { userId: ..., iat: ..., exp: ... }
  } catch (error) {
    // jwt.verify throws errors like TokenExpiredError, JsonWebTokenError
    console.warn(`Token verification failed: ${error.name} - ${error.message}`); // Log as warning
    // Depending on error.name, you might want to throw specific custom errors
    // e.g., if (error.name === 'TokenExpiredError') throw new CustomAuthError('Token expired');
    throw error; // Re-throw the original error (or a custom one) to be handled by controller
  }
};

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
};
