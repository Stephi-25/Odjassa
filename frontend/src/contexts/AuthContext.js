import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService'; // Import the actual apiService

// Create the context
const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store user object { id, username, email, role, ... }
  const [token, setToken] = useState(localStorage.getItem('authToken')); // Load token from localStorage
  const [isLoading, setIsLoading] = useState(true); // To handle initial auth state loading

  useEffect(() => {
    // Attempt to verify token and fetch user data if token exists on initial load
    const verifyTokenAndFetchUser = async () => {
      if (token) {
        try {
          // Token exists, try to fetch user profile to validate token and get fresh user data
          // The apiService interceptor will automatically add the token to the header.
          const response = await apiService.getMyProfile(); // { status, data: { user } }
          if (response.status === 'success' && response.data && response.data.user) {
            setUser(response.data.user);
          } else {
            // Token might be invalid or user not found for some reason
            console.warn('Token verification failed or user not found, logging out.');
            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          // This catch block handles errors from apiService.getMyProfile()
          // (e.g., network error, 401 Unauthorized if token is invalid/expired)
          console.warn('Failed to verify token or fetch user on load:', error.message || error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyTokenAndFetchUser();
  }, [token]); // Re-run if token changes (e.g., after login)

  // Login function (will call API later)
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiService.loginUser({ email, password });
      // Expected response: { status: 'success', message: '...', token: '...', data: { user: { ... } } }
      if (response.status === 'success' && response.token && response.data && response.data.user) {
        const { token: newToken, data: { user: loggedInUser } } = response;

        localStorage.setItem('authToken', newToken);
        setToken(newToken); // This will trigger the useEffect to verify and set user if needed, or just set user directly
        setUser(loggedInUser); // Set user directly from login response
        setIsLoading(false);
        return loggedInUser;
      } else {
        // Handle cases where API returns success but data is not as expected
        throw new Error(response.message || 'Login failed: Invalid response from server.');
      }
    } catch (error) {
      // error object here is likely from apiService, which might be error.response.data or an Error instance
      console.error('Login failed in AuthContext:', error.message || error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      throw error; // Rethrow to be caught by the form
    }
  };

  // Register function (will call API later)
  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await apiService.registerUser(userData);
      // Expected response: { status: 'success', message: '...', token: '...', data: { user: { ... } } }
      if (response.status === 'success' && response.token && response.data && response.data.user) {
        const { token: newToken, data: { user: registeredUser } } = response;

        localStorage.setItem('authToken', newToken);
        setToken(newToken); // This will trigger the useEffect to verify and set user if needed
        setUser(registeredUser); // Set user directly from register response
        setIsLoading(false);
        return registeredUser;
      } else {
        throw new Error(response.message || 'Registration failed: Invalid response from server.');
      }
    } catch (error) {
      console.error('Registration failed in AuthContext:', error.message || error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      throw error; // Rethrow to be caught by the form
    }
  };

  // Logout function
  const logout = () => {
    console.log('[AuthContext] Logging out');
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    // Optionally: make an API call to invalidate the token on the server
    // await apiService.logoutUser();
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading, // Expose isLoading so UI can show loading state
    login,
    register,
    logout,
    // No need to expose setUser or setToken directly usually
  };

  // Don't render children until initial loading is complete to avoid flashes of content
  // or to ensure routes are correctly protected based on auth state.
  // Alternatively, some apps show a global spinner.
  // if (isLoading && token) { // Only show loading if there was a token to verify
  // return <div>Loading session...</div>; // Or a spinner component
  // }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
