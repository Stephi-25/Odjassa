/**
 * Handles the upload of a single product image.
 * Expects the file to be processed by multer middleware and available in req.file.
 */
const uploadSingleProductImageHandler = (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No image file uploaded. Please select an image.');
      error.statusCode = 400;
      throw error;
    }

    // Construct the public URL for the uploaded file
    // This depends on how static files are served and the base URL of the app.
    // Assuming files in 'public/uploads/products/' are served at '/uploads/products/'
    const fileUrl = `/uploads/products/${req.file.filename}`;
    // For a full URL, you might need: `${req.protocol}://${req.get('host')}${fileUrl}`
    // However, returning a relative path is often more flexible for frontends.

    res.status(201).json({
      status: 'success',
      message: 'Image uploaded successfully.',
      data: {
        filePath: req.file.path, // Server-side path (for debugging or internal use)
        fileName: req.file.filename, // Name of the file on the server
        publicUrl: fileUrl, // URL to access the file
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    // Errors from multer (like fileFilter rejection before this controller is hit)
    // should be handled by a dedicated multer error handler in the route.
    // This catch block is for other unexpected errors or explicit throws from this controller.
    next(error);
  }
};

/**
 * Handles the upload of multiple product images.
 * Expects files to be processed by multer middleware and available in req.files.
 */
const uploadMultipleProductImagesHandler = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      const error = new Error('No image files uploaded. Please select one or more images.');
      error.statusCode = 400;
      throw error;
    }

    const uploadedFilesData = req.files.map(file => {
      const fileUrl = `/uploads/products/${file.filename}`;
      return {
        filePath: file.path,
        fileName: file.filename,
        publicUrl: fileUrl,
        mimetype: file.mimetype,
        size: file.size,
      };
    });

    res.status(201).json({
      status: 'success',
      message: `${req.files.length} image(s) uploaded successfully.`,
      data: {
        files: uploadedFilesData,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  uploadSingleProductImageHandler,
  uploadMultipleProductImagesHandler,
};
