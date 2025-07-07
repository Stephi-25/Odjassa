import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * A component to protect routes that require authentication.
 * If the user is authenticated, it renders the child components (using <Outlet /> for nested routes).
 * If not authenticated, it redirects the user to the login page,
 * preserving the original location they were trying to access.
 *
 * It also handles the loading state from AuthContext to prevent premature redirects
 * while authentication status is being determined.
 * Can also check for specific roles if `allowedRoles` prop is provided.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // While AuthContext is determining auth state (e.g., verifying token),
    // show a loading indicator or return null to prevent rendering child components.
    return <div>Loading session...</div>; // Or a proper spinner component
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login page.
    // Pass the current location in state so we can redirect back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, now check roles if allowedRoles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      // User does not have one of the allowed roles.
      // Redirect to a 'Not Authorized' page or home page.
      // For simplicity, redirecting to home. A dedicated "403 Forbidden" page would be better.
      console.warn(`User role '${user?.role}' not in allowed roles: ${allowedRoles.join(', ')} for route ${location.pathname}`);
      return <Navigate to="/" state={{ from: location }} replace />;
      // Or: return <Navigate to="/unauthorized" replace />;
    }
  }

  // User is authenticated and has the required role (if specified).
  // If 'children' prop is provided, render it (for single component protection).
  // Otherwise, render <Outlet /> (for nested route protection defined in App.js).
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
