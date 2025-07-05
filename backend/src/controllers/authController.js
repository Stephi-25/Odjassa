const userModel = require('../models/userModel');
const authService = require('../services/authService');

// Basic input validation helper (can be expanded or replaced with a library like Joi or express-validator)
const validateInput = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !(field in data) || data[field] === undefined || data[field] === '');
  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
    error.statusCode = 400; // Bad Request
    throw error;
  }
  // Add more specific validations like email format, password length etc. here if needed
  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    const error = new Error('Invalid email format.');
    error.statusCode = 400;
    throw error;
  }
  if (data.password && data.password.length < 6) { // Example: min password length
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }
};


const register = async (req, res, next) => {
  try {
    validateInput(req.body, ['username', 'email', 'password']);
    const { username, email, password, role, firstName, lastName } = req.body;

    // Check if user already exists (optional, as DB constraint will also catch it)
    // const existingUserByEmail = await userModel.findUserByEmail(email);
    // if (existingUserByEmail) {
    //   const error = new Error('Email already in use.');
    //   error.statusCode = 409; // Conflict
    //   throw error;
    // }
    // const existingUserByUsername = await userModel.findUserByUsername(username); // Requires model function
    // if (existingUserByUsername) { ... }


    const hashedPassword = await authService.hashPassword(password);

    const newUser = await userModel.createUser(
      username,
      email,
      hashedPassword,
      role, // role can be optional, defaulting in model
      firstName,
      lastName
    );

    // Generate JWT token
    const tokenPayload = { userId: newUser.id, role: newUser.role };
    const token = authService.generateToken(tokenPayload);

    // Omit password_hash from the response
    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      token,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    // Pass error to the global error handler in server.js
    // Ensure statusCode is set for specific errors (like validation, conflict)
    if (!error.statusCode) {
        // Handle DB unique constraint errors specifically if not caught by model
        if (error.message.includes('already exists')) error.statusCode = 409;
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    validateInput(req.body, ['email', 'password']);
    const { email, password } = req.body;

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password.'); // Generic message
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    const isMatch = await authService.comparePasswords(password, user.password_hash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.'); // Generic message
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Generate JWT token
    const tokenPayload = { userId: user.id, role: user.role };
    const token = authService.generateToken(tokenPayload);

    // Omit password_hash from the response
    const { password_hash, ...userResponse } = user;

    // Optional: update last_login timestamp (would require a userModel function)
    // await userModel.updateLastLogin(user.id);

    res.status(200).json({
      status: 'success',
      message: 'User logged in successfully.',
      token,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
};
