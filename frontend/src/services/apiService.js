import axios from 'axios'; // Using the mocked axios

// Determine the API base URL
// In a real Create React App, you'd use REACT_APP_API_URL from .env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Authentication Service Functions ---

/**
 * Registers a new user.
 * @param {object} userData - { username, email, password, firstName, lastName, role }
 * @returns {Promise<object>} The API response data (token and user info).
 */
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return response.data; // Expected: { status, message, token, data: { user } }
  } catch (error) {
    // Axios wraps HTTP errors in error.response
    // console.error('API Register Error:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Registration failed due to a network or server error.');
  }
};

/**
 * Logs in an existing user.
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} The API response data (token and user info).
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data; // Expected: { status, message, token, data: { user } }
  } catch (error) {
    // console.error('API Login Error:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Login failed due to a network or server error.');
  }
};

/**
 * Fetches the current authenticated user's profile.
 * Token is automatically added by the interceptor.
 * @returns {Promise<object>} The API response data (user info).
 */
export const getMyProfile = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response.data; // Expected: { status, data: { user } }
  } catch (error) {
    // console.error('API Get Profile Error:', error.response || error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch profile due to a network or server error.');
  }
};


// --- Placeholder for Product Service Functions ---
// export const getProducts = async () => { ... }
// export const getProductById = async (id) => { ... }

// We can export functions individually or as an object
const apiService = {
  registerUser,
  loginUser,
  getMyProfile,
  // Add other methods here

  // --- Product Service Functions ---

  /**
   * Uploads a single product image.
   * @param {FormData} formData - The FormData object containing the image file.
   *                               formData.append('productImage', file);
   * @returns {Promise<object>} The API response data (image URL/path).
   */
  uploadProductImage: async (formData) => {
    try {
      // For file uploads, Content-Type is typically set by browser/axios with FormData
      // So, we might need a separate axios instance or override headers for this request.
      // However, our current interceptor adds Authorization, which is good.
      // Let's assume the global apiClient can handle FormData correctly.
      // If not, a specific instance for file uploads might be needed.
      const response = await apiClient.post('/uploads/product-image/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });
      return response.data; // Expected: { status, message, data: { publicUrl, ... } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Image upload failed.');
    }
  },

  /**
   * Creates a new product.
   * @param {object} productData - Data for the new product.
   * @returns {Promise<object>} The API response data (created product).
   */
  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data; // Expected: { status, message, data: { product } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to create product.');
    }
  },

  /**
   * Gets products, possibly filtered.
   * @param {object} params - Query parameters (e.g., { vendor_id: '123', category_id: '1', status: 'active', limit: 10, page: 1 }).
   * @returns {Promise<object>} The API response data (list of products).
   */
  getProducts: async (params = {}) => {
    try {
      const response = await apiClient.get('/products', { params });
      return response.data; // Expected: { status, results, data: { products } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch products.');
    }
  },

  /**
   * Gets products for a specific vendor.
   * @param {string|number} vendorId - The ID of the vendor.
   * @param {object} params - Additional query parameters (e.g., { status: 'active', limit: 10, page: 1 }).
   * @returns {Promise<object>} The API response data (list of products).
   */
  getVendorProducts: async (vendorId, params = {}) => {
    try {
      const queryParams = { ...params, vendor_id: vendorId };
      const response = await apiClient.get('/products', { params: queryParams });
      return response.data; // Expected: { status, results, data: { products } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch vendor products.');
    }
  },

  /**
   * Gets a single product by its ID.
   * @param {string|number} productId - The ID of the product.
   * @returns {Promise<object>} The API response data (product details).
   */
  getProductById: async (productId) => {
    try {
      const response = await apiClient.get(`/products/${productId}`);
      return response.data; // Expected: { status, data: { product } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch product.');
    }
  },

  /**
   * Updates an existing product.
   * @param {string|number} productId - The ID of the product to update.
   * @param {object} productData - Data to update the product with.
   * @returns {Promise<object>} The API response data (updated product).
   */
  updateProduct: async (productId, productData) => {
    try {
      const response = await apiClient.put(`/products/${productId}`, productData);
      return response.data; // Expected: { status, message, data: { product } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to update product.');
    }
  },

  /**
   * Deletes a product.
   * @param {string|number} productId - The ID of the product to delete.
   * @returns {Promise<object>} The API response data (confirmation or deleted product).
   */
  deleteProduct: async (productId) => {
    try {
      const response = await apiClient.delete(`/products/${productId}`);
      return response.data; // Expected: { status, message, data: { product } } (or just status/message)
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to delete product.');
    }
  },

  // --- Order Service Functions ---

  /**
   * Gets all orders for the authenticated user.
   * @param {object} params - Query parameters (e.g., { limit: 10, page: 1 }).
   * @returns {Promise<object>} The API response data (list of orders).
   */
  getUserOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/orders', { params });
      return response.data; // Expected: { status, results, data: { orders } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch user orders.');
    }
  },

  /**
   * Gets details of a specific order.
   * @param {string|number} orderId - The ID of the order.
   * @returns {Promise<object>} The API response data (order details including items).
   */
  getOrderDetails: async (orderId) => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data; // Expected: { status, data: { order, items } }
    } catch (error) {
      throw error.response ? error.response.data : new Error('Failed to fetch order details.');
    }
  },

  /**
   * Creates a new order.
   * @param {object} orderData - { items: [{product_id, quantity}], shipping_address, ... }
   * @returns {Promise<object>} API response.
   */
  createOrder: async (orderData) => {
    try {
        const response = await apiClient.post('/orders', orderData);
        return response.data; // Expected: { status, message, data: { order, items } }
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to create order.');
    }
  }
  // Add more order related functions here if needed (e.g., cancelOrder)

};

export default apiService;
