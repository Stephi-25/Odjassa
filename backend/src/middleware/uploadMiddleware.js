const multer = require('multer'); // Using the mocked multer
const path = require('path');
const fs = require('fs');

// Define the storage destination and filename generation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../public/uploads/products/');
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: fieldname-timestamp.extension
    // Example: productImage-1609459200000.png
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter to accept only certain image types
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, or WEBP images are allowed.'), false); // Reject file
  }
};

// Configure multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB file size limit
    // Can also add limits for: files (max number of files), fieldNameSize, etc.
  }
});

// Middleware for uploading a single product image
// The field name in the form-data should be 'productImage'
const uploadSingleProductImage = upload.single('productImage');

// Middleware for uploading multiple product images (e.g., up to 5)
// The field name in the form-data should be 'productImages'
const uploadMultipleProductImages = upload.array('productImages', 5);


// Custom error handler for multer errors (optional, but good for user experience)
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    let message = `File upload error: ${err.message}.`;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File is too large. Maximum size is 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field. Please check the field name for upload.';
    }
    // ... handle other multer error codes as needed
    return res.status(400).json({ status: 'fail', message });
  } else if (err) {
    // An unknown error occurred when uploading (e.g., from fileFilter).
    // The fileFilter error message is already specific.
    return res.status(400).json({ status: 'fail', message: err.message || 'An unknown error occurred during file upload.' });
  }
  // Everything went fine, or no file was uploaded (if optional)
  next();
};


module.exports = {
  uploadSingleProductImage,
  uploadMultipleProductImages,
  handleUploadErrors, // Export the error handler to be used in routes
  // You could also just export 'upload' and let routes call .single() or .array()
  // upload,
};
