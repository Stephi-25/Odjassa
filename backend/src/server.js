const express = require('express');
const path = require('path'); // Import path module
const cors = require('cors'); // Import cors middleware
// const dotenv = require('dotenv'); // We might add this later if needed for .env file directly

// Load environment variables (though Docker Compose will primarily set them)
// dotenv.config(); // Uncomment if you add a .env file at backend/src or backend/

const app = express();

// Middlewares
app.use(express.json()); // Middleware to parse JSON bodies

// CORS Middleware -
// Allow requests from your frontend development server or your deployed frontend URL.
// For development, if frontend is on localhost:3000 (React default) or 3001 (if using frontend-prod-build from compose)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || [
    'http://localhost:3000', // Common React dev port
    'http://localhost:3001', // Port used in docker-compose.yml for frontend-prod-build
    // Add your deployed frontend URL here for production
  ],
  optionsSuccessStatus: 200 // For legacy browser compatibility
};
app.use(cors(corsOptions));
console.log(`CORS enabled for origins: ${JSON.stringify(corsOptions.origin)}`);


// Serve static files (e.g., uploaded product images)
// This makes files in backend/public/uploads/products accessible via /uploads/products URL path
app.use('/uploads/products', express.static(path.join(__dirname, '../public/uploads/products')));


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
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes'); // Import delivery routes

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/delivery', deliveryRoutes); // Add delivery routes

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
