const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  uploadSingleProductImage,
  uploadMultipleProductImages,
  handleUploadErrors // Import the custom error handler
} = require('../middleware/uploadMiddleware');

const router = express.Router();

// All upload routes should be protected, e.g., only vendors or admins can upload product images.
// Using authorize('vendor', 'admin') to allow both roles. Adjust if only one role is needed.
router.use(protect);
router.use(authorize('vendor', 'admin'));


/**
 * @route   POST /api/v1/uploads/product-image/single
 * @desc    Upload a single product image.
 * @access  Private (Vendor or Admin)
 */
router.post(
  '/product-image/single',
  uploadSingleProductImage, // Multer middleware for single file upload, field name 'productImage'
  handleUploadErrors,       // Custom error handler for multer and fileFilter errors
  uploadController.uploadSingleProductImageHandler
);

/**
 * @route   POST /api/v1/uploads/product-image/multiple
 * @desc    Upload multiple product images (e.g., up to 5).
 * @access  Private (Vendor or Admin)
 */
router.post(
  '/product-image/multiple',
  uploadMultipleProductImages, // Multer middleware for multiple files, field name 'productImages', max 5 files
  handleUploadErrors,          // Custom error handler
  uploadController.uploadMultipleProductImagesHandler
);

module.exports = router;
