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

import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';


function App() {
  return (
    <>
      <Header /> {/* Basic Header for navigation */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Route for Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Example of using Outlet for multiple nested protected routes:
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route index element={<DashboardHomePage />} />
            <Route path="settings" element={<DashboardSettingsPage />} />
          </Route>
          */}

          {/* Add other routes here as needed */}
          <Route path="*" element={<NotFoundPage />} /> {/* Catch-all for 404 */}
        </Routes>
      </main>
      {/* Basic Footer can go here */}
      {/* <footer><p>&copy; 2023 Odjassa-Net</p></footer> */}
    </>
  );
}

export default App;
