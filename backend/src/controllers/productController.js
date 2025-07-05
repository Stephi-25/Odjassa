const productModel = require('../models/productModel');

// Helper for basic input validation (can be expanded or replaced)
const validateProductInput = (data, isUpdate = false) => {
  const errors = [];
  if (!isUpdate && (!data.name || data.name.trim() === '')) {
    errors.push('Product name is required.');
  }
  if (!isUpdate && (data.price === undefined || data.price === null || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0)) {
    errors.push('Valid product price is required.');
  }
  if (data.stock_quantity !== undefined && (isNaN(parseInt(data.stock_quantity)) || parseInt(data.stock_quantity) < 0)) {
    errors.push('Stock quantity must be a non-negative integer.');
  }
  // Add more validations: description length, SKU format, category_id existence (if categories table is ready) etc.

  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400; // Bad Request
    throw error;
  }
};


/**
 * Create a new product.
 * Accessible only by users with 'vendor' role.
 */
const createProduct = async (req, res, next) => {
  try {
    validateProductInput(req.body);
    const { name, description, price, sku, stock_quantity, category_id, images, tags } = req.body;

    // vendor_id comes from the authenticated user
    const vendor_id = req.user.id;
    // Role check should be done by middleware (authorize('vendor')), but double check here for safety if needed.
    if (req.user.role !== 'vendor') {
        const error = new Error('Only vendors can create products.');
        error.statusCode = 403; // Forbidden
        throw error;
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      sku,
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      vendor_id,
      category_id: category_id ? parseInt(category_id) : null,
      images, // Assuming images is already in correct JSONB format (e.g., array of URLs)
      tags,   // Assuming tags is already in correct TEXT[] format
      status: 'pending_approval', // Default status for new products
    };

    const newProduct = await productModel.create(productData);
    res.status(201).json({
      status: 'success',
      message: 'Product created successfully. It is pending approval.',
      data: { product: newProduct },
    });
  } catch (error) {
    if (!error.statusCode && error.message.includes('SKU already exists')) error.statusCode = 409;
    next(error);
  }
};

/**
 * Get a single product by its ID.
 * Publicly accessible.
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400;
        throw error;
    }
    const product = await productModel.findById(parseInt(id));
    if (!product) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      return next(error);
    }
    // Optional: Filter product details if some fields shouldn't be public until approved, etc.
    // For now, send all if status is 'active' or if user is admin/owner
    // This logic can be complex, for MVP, let's assume public products are fine to show fully.
    // if (product.status !== 'active' && (!req.user || (req.user.id !== product.vendor_id && req.user.role !== 'admin'))) {
    //    return res.status(403).json({ status: 'fail', message: 'This product is not yet available.'});
    // }

    res.status(200).json({
      status: 'success',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all products, with optional filtering and pagination.
 * Publicly accessible. Filters might be restricted for non-admins.
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { vendor_id, category_id, status, searchTerm, limit = 10, page = 1 } = req.query;
    const filters = {};
    if (vendor_id) filters.vendor_id = parseInt(vendor_id);
    if (category_id) filters.category_id = parseInt(category_id);

    // By default, public users should only see 'active' products.
    // Admins or specific roles might see other statuses.
    if (req.user && (req.user.role === 'admin' || req.user.role === 'vendor')) { // vendors might see their own pending products
        if (status) filters.status = status;
        // If vendor, and no specific status is queried, they might see their own products regardless of status
        // This logic can be refined if vendor_id is also part of the query by a vendor for their own products.
    } else {
        filters.status = 'active'; // Default for public view
        if (status && status !== 'active') {
            // Public user trying to query non-active status - could ignore or error
            // For now, let's enforce 'active' if no specific role allows other statuses.
            filters.status = 'active';
        }
    }


    if (searchTerm) filters.searchTerm = searchTerm;

    const paginationOptions = {
      limit: parseInt(limit) || 10,
      offset: ((parseInt(page) || 1) - 1) * (parseInt(limit) || 10),
    };

    const products = await productModel.findAll(filters, paginationOptions);

    // TODO: Add total count for pagination metadata if needed
    // const totalProducts = await productModel.countAll(filters);
    // res.status(200).json({ status: 'success', results: products.length, data: { products }, total: totalProducts, page: parseInt(page) });

    res.status(200).json({
      status: 'success',
      results: products.length, // Number of items on this page
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing product.
 * Accessible by product owner (vendor) or admin.
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productDataToUpdate = req.body;

    if (isNaN(parseInt(id))) {
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400;
        throw error;
    }

    validateProductInput(productDataToUpdate, true); // true for isUpdate

    // Fetch the product first to check ownership/permissions
    const existingProduct = await productModel.findById(parseInt(id));
    if (!existingProduct) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Check permission: user must be the vendor who owns the product or an admin
    if (req.user.role !== 'admin' && existingProduct.vendor_id !== req.user.id) {
      const error = new Error('You are not authorized to update this product.');
      error.statusCode = 403; // Forbidden
      return next(error);
    }

    // Admin might be allowed to change status, vendor might not directly change to 'active' (moderation flow)
    // For now, keeping it simple: if admin, can change status. If vendor, status might be reset to 'pending_approval' upon significant edits.
    // This logic needs refinement based on moderation rules.
    if (req.user.role !== 'admin' && productDataToUpdate.status && productDataToUpdate.status !== existingProduct.status) {
        // If a vendor tries to change status, it might be restricted or reset.
        // For MVP, let's say vendors cannot change status directly after creation.
        // Or if they edit, it goes back to 'pending_approval'.
        // delete productDataToUpdate.status; // Or handle as below for re-approval
        if (productDataToUpdate.status !== 'pending_approval' && productDataToUpdate.status !== 'inactive') { // Example: vendor can only set to inactive
            const error = new Error('Vendors can only set product status to inactive or it may require re-approval.');
            error.statusCode = 403;
            // return next(error); // More complex logic needed here for moderation flow
        }
        // For now, if vendor edits, let's assume it might need re-approval (handled by admin/moderator)
        // productDataToUpdate.status = 'pending_approval'; // This is a business rule
    }


    const updatedProduct = await productModel.update(parseInt(id), productDataToUpdate);
    if (!updatedProduct) { // Should not happen if findById worked, but good check
        const error = new Error('Product not found or update failed.');
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
      status: 'success',
      message: 'Product updated successfully.',
      data: { product: updatedProduct },
    });
  } catch (error) {
    if (!error.statusCode && error.message.includes('SKU already exists')) error.statusCode = 409;
    next(error);
  }
};

/**
 * Delete a product.
 * Accessible by product owner (vendor) or admin.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(parseInt(id))) {
        const error = new Error('Invalid product ID format.');
        error.statusCode = 400;
        throw error;
    }

    // Fetch the product first to check ownership/permissions
    const existingProduct = await productModel.findById(parseInt(id));
    if (!existingProduct) {
      const error = new Error('Product not found.');
      error.statusCode = 404;
      return next(error);
    }

    // Check permission: user must be the vendor who owns the product or an admin
    if (req.user.role !== 'admin' && existingProduct.vendor_id !== req.user.id) {
      const error = new Error('You are not authorized to delete this product.');
      error.statusCode = 403; // Forbidden
      return next(error);
    }

    const deletedProduct = await productModel.remove(parseInt(id));
     if (!deletedProduct) { // Should not happen if findById worked
        const error = new Error('Product not found or deletion failed.');
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({ // Or 204 No Content, but returning deleted item can be useful
      status: 'success',
      message: 'Product deleted successfully.',
      data: { product: deletedProduct } // Or null if 204
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
