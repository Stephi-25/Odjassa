// const userModel = require('../models/userModel'); // Not strictly needed if only using req.user

/**
 * Get current authenticated user's profile.
 * Assumes `authMiddleware.protect` has run and attached `req.user`.
 */
const getMe = (req, res, next) => {
  // req.user should be populated by the authMiddleware.protect
  // It contains the user object fetched from the database (excluding password_hash)
  if (!req.user) {
    const error = new Error('User not found or not authenticated.');
    error.statusCode = 401; // Unauthorized
    return next(error);
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};

// Placeholder for other user-related controller functions
// e.g., updateMe, deleteMe, getAllUsers (admin), getUserById (admin)

/*
const updateMe = async (req, res, next) => {
  try {
    // 1. Get user from req.user (added by protect middleware)
    const userId = req.user.id;

    // 2. Filter out fields that should not be updated by this route (e.g., password, role)
    const { username, email, firstName, lastName, ...otherData } = req.body;
    if (Object.keys(otherData).some(key => !['username', 'email', 'firstName', 'lastName', 'profile_picture_url', 'phone_number', 'address'].includes(key))) {
        // Or be more specific about allowed fields
        const error = new Error('Invalid fields for update.');
        error.statusCode = 400;
        return next(error);
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    // Add other updatable fields from userModel here e.g. profile_picture_url

    if (Object.keys(updateData).length === 0) {
        const error = new Error('No valid fields provided for update.');
        error.statusCode = 400;
        return next(error);
    }

    // 3. Call a userModel function to update the user
    // const updatedUser = await userModel.updateUserById(userId, updateData);
    // Make sure updateUserById returns the updated user without sensitive info

    // res.status(200).json({
    //   status: 'success',
    //   data: {
    //     user: updatedUser,
    //   },
    // });

    res.status(501).json({ status: 'fail', message: 'UpdateMe not yet implemented' });

  } catch (error) {
    next(error);
  }
};
*/

module.exports = {
  getMe,
  // updateMe, // If you implement it
};
