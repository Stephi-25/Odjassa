const jwt = require('jsonwebtoken'); // Mocked jsonwebtoken
const authService = require('../services/authService'); // To use verifyToken
const userModel = require('../models/userModel');

/**
 * Middleware to protect routes that require authentication.
 * Verifies JWT from the Authorization header.
 * Attaches user information to req.user if token is valid.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token using the authService
      const decoded = authService.verifyToken(token); // This will throw if invalid or expired

      // Check if user still exists (optional, but good practice)
      // The decoded payload should contain user ID (e.g., userId)
      const currentUser = await userModel.findUserById(decoded.userId);

      if (!currentUser) {
        const error = new Error('The user belonging to this token no longer exists.');
        error.statusCode = 401; // Unauthorized
        return next(error);
      }

      // Optional: Check if user changed password after the token was issued
      // This requires storing a passwordChangedAt timestamp in the user model
      // if (currentUser.passwordChangedAfter(decoded.iat)) { // iat is "issued at" timestamp
      //   const error = new Error('User recently changed password. Please log in again.');
      //   error.statusCode = 401;
      //   return next(error);
      // }

      // Grant access to protected route, attach user to request object
      // Exclude password_hash from req.user
      const { password_hash, ...userWithoutPassword } = currentUser;
      req.user = userWithoutPassword;

      next();
    } catch (error) {
      // Handle errors from authService.verifyToken (e.g., TokenExpiredError, JsonWebTokenError)
      // Or errors from user check
      const authError = new Error('Not authorized, token failed.');
      authError.statusCode = 401; // Unauthorized
      // You might want to pass the original error's message or name for logging
      // console.error('Auth Middleware Error:', error.name, error.message);
      if (error.name === 'TokenExpiredError') {
        authError.message = 'Your session has expired. Please log in again.';
      } else if (error.name === 'JsonWebTokenError') {
        authError.message = 'Invalid token. Please log in again.';
      }
      return next(authError);
    }
  }

  if (!token) {
    const error = new Error('Not authorized, no token provided.');
    error.statusCode = 401; // Unauthorized
    return next(error);
  }
};

/**
 * Middleware to restrict access based on user roles.
 * Example: authorize('admin', 'vendor')
 * @param  {...string} roles Allowed roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      const error = new Error('Not authorized to access this route (user role not defined).');
      error.statusCode = 401; // Or 403 Forbidden
      return next(error);
    }
    if (!roles.includes(req.user.role)) {
      const error = new Error(`Role '${req.user.role}' is not authorized to access this route.`);
      error.statusCode = 403; // Forbidden
      return next(error);
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
