# API Documentation

This document outlines the API endpoints for the Odjassa-Net platform.

## Base URL

The base URL for all API endpoints will be `/api/v1`.

## Authentication

Authentication is handled via JSON Web Tokens (JWT). The token should be included in the `Authorization` header as a Bearer token:

`Authorization: Bearer <YOUR_JWT_TOKEN>`

## Endpoints

(Details of endpoints will be added as they are developed)

### Auth
*   `POST /auth/register` - Register a new user.
*   `POST /auth/login` - Login an existing user, returns JWT.
*   `POST /auth/logout` - Logout user (server-side token invalidation if implemented).
*   `GET /auth/me` - Get current authenticated user's profile.

### Users
*   `GET /users` - List users (Admin only).
*   `GET /users/:id` - Get user by ID (Admin or self).
*   `PUT /users/:id` - Update user (Admin or self).
*   `DELETE /users/:id` - Delete user (Admin or self).

### Products
*   `GET /products` - List all products (with filtering/pagination).
*   `GET /products/:id` - Get a specific product.
*   `POST /products` - Create a new product (Vendor only).
*   `PUT /products/:id` - Update a product (Vendor owner or Admin).
*   `DELETE /products/:id` - Delete a product (Vendor owner or Admin).

### Categories
*   (To be defined)

### Orders
*   (To be defined)

### Delivery
*   (To be defined)

### Recommendations
*   (To be defined)

### Admin
*   (Specific admin endpoints to be defined)
