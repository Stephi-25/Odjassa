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
};

export default apiService;
