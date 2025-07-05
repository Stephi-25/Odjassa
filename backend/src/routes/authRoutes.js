const express = require('express');
const authController = require('../controllers/authController');
// const authMiddleware = require('../middleware/authMiddleware'); // For protected auth routes if any (e.g. /logout, /refresh-token)

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login an existing user
 * @access  Public
 */
router.post('/login', authController.login);

// Example of a protected route within auth if needed later:
// router.post('/logout', authMiddleware.protect, authController.logout);
// router.get('/me', authMiddleware.protect, authController.getMe); // Or move /me to userRoutes

module.exports = router;
