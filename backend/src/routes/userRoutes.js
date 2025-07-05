const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes defined below this will first pass through authMiddleware.protect
router.use(authMiddleware.protect);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current logged-in user's profile
 * @access  Private (requires authentication)
 */
router.get('/me', userController.getMe);

// Future routes for user management:
// router.patch('/updateMe', userController.updateMe); // Update current user's profile (name, email etc. not password)
// router.patch('/updateMyPassword', authController.updatePassword); // Separate route for password update

// Admin only routes (example)
// router.use(authMiddleware.authorize('admin')); // All subsequent routes are admin only
// router.get('/', userController.getAllUsers);
// router.get('/:id', userController.getUser);
// router.patch('/:id', userController.updateUser); // Admin updates any user
// router.delete('/:id', userController.deleteUser); // Admin deletes any user

module.exports = router;
