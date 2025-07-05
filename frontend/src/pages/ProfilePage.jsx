import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  // Although ProtectedRoute handles this, an extra check here can be useful
  // or if this page were accessed without ProtectedRoute for some reason.
  if (!isAuthenticated || !user) {
    // This case should ideally be handled by ProtectedRoute redirecting to /login
    // If somehow reached, redirect or show an appropriate message.
    // For now, assume ProtectedRoute does its job. If user is null despite isAuthenticated being true,
    // that's an inconsistent state AuthContext should prevent.
    console.warn("ProfilePage reached with isAuthenticated true but no user data, or !isAuthenticated.");
    return <Navigate to="/login" replace />;
  }

  // Format date helper (can be moved to utils.js)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <h1>User Profile</h1>
      <div>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>First Name:</strong> {user.first_name || 'N/A'}</p>
        <p><strong>Last Name:</strong> {user.last_name || 'N/A'}</p>
        <p><strong>Phone Number:</strong> {user.phone_number || 'N/A'}</p>
        <p><strong>Address:</strong> {user.address || 'N/A'}</p>
        {user.profile_picture_url && (
          <div>
            <strong>Profile Picture:</strong> <br />
            <img src={user.profile_picture_url} alt={`${user.username}'s profile`} style={{width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover'}}/>
          </div>
        )}
        <p><strong>Email Verified:</strong> {user.email_verified ? 'Yes' : 'No'}</p>
        <p><strong>Account Active:</strong> {user.is_active ? 'Yes' : 'No'}</p>
        <p><strong>Last Login:</strong> {formatDate(user.last_login)}</p>
        <p><strong>Joined:</strong> {formatDate(user.created_at)}</p>
        {/* Display other user information here */}
      </div>
      {/* Add links to edit profile, change password, etc. later */}
    </div>
  );
};

export default ProfilePage;
