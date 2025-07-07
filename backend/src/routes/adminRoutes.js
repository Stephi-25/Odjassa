const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes in this file are protected and require 'admin' role.
router.use(protect);        // Ensures user is logged in
router.use(authorize('admin')); // Ensures user has 'admin' role

/**
 * @route   PATCH /api/v1/admin/products/:productId/moderate
 * @desc    Moderate a product (update status and add moderation notes).
 * @access  Private (Admin only)
 */
router.patch('/products/:productId/moderate', adminController.moderateProduct);


// Future admin routes can be added here:
// Example: Manage users
// router.get('/users', adminController.getAllUsers);
// router.patch('/users/:userId/role', adminController.updateUserRole);

// Example: Manage categories
// router.post('/categories', adminController.createCategory);
// router.put('/categories/:categoryId', adminController.updateCategory);
// router.delete('/categories/:categoryId', adminController.deleteCategory);

module.exports = router;
