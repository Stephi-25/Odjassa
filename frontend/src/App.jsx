import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Page Components (we'll create these soon)
// import HomePage from './pages/HomePage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
// Vendor Pages
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';
import ProductCreatePage from './pages/vendor/ProductCreatePage';
import ProductEditPage from './pages/vendor/ProductEditPage';
// Order Pages
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';

import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';


function App() {
  return (
    <>
      <Header /> {/* Basic Header for navigation */}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User Protected Routes (any authenticated user) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Vendor Protected Routes (role 'vendor' required) */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products/new"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <ProductCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products/edit/:productId"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <ProductEditPage />
              </ProtectedRoute>
            }
          />

          {/* Order Routes (for authenticated users) */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Example of using Outlet for multiple nested protected routes:
          <Route path="/admin/panel" element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUserManagementPage />} />
          </Route>
          */}

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* Basic Footer can go here */}
      {/* <footer><p>&copy; 2023 Odjassa-Net</p></footer> */}
    </>
  );
}

export default App;
