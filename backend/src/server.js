const express = require('express');
// const dotenv = require('dotenv'); // We might add this later if needed for .env file directly

// Load environment variables (though Docker Compose will primarily set them)
// dotenv.config(); // Uncomment if you add a .env file at backend/src or backend/

const app = express();

// Middlewares
app.use(express.json()); // Middleware to parse JSON bodies

// Basic health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Odjassa-Net API is healthy and running!',
    timestamp: new Date().toISOString()
  });
});

// Import Routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);

// Global error handler (very basic for now)
app.use((err, req, res, next) => {
  console.error('ERROR 💥', err);
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went very wrong!'
  });
});

// Not found handler for all other routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access health check at http://localhost:${PORT}/api/v1/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1); // Exit process with failure
  });
});

// Handle SIGTERM signal (e.g., from Docker stop)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

module.exports = app; // Export app for potential testing or other uses
