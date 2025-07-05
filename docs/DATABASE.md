# Database Schema Documentation

This document describes the database schema for the Odjassa-Net platform. The database used is PostgreSQL.

## Tables

### `users`

Stores information about all users of the platform (customers, vendors, delivery personnel, admins).

| Column              | Type                        | Constraints                                  | Description                                                                 |
| ------------------- | --------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `id`                | `SERIAL`                    | `PRIMARY KEY`                                | Unique identifier for the user.                                             |
| `username`          | `VARCHAR(255)`              | `UNIQUE NOT NULL`                            | Unique username for login.                                                  |
| `email`             | `VARCHAR(255)`              | `UNIQUE NOT NULL`                            | Unique email address for communication and login.                           |
| `password_hash`     | `VARCHAR(255)`              | `NOT NULL`                                   | Hashed password.                                                            |
| `role`              | `VARCHAR(50)`               | `NOT NULL DEFAULT 'customer'`                | User's role (e.g., 'customer', 'vendor', 'delivery_person', 'admin').     |
| `first_name`        | `VARCHAR(100)`              |                                              | User's first name.                                                          |
| `last_name`         | `VARCHAR(100)`              |                                              | User's last name.                                                           |
| `phone_number`      | `VARCHAR(20)`               |                                              | User's phone number.                                                        |
| `address`           | `TEXT`                      |                                              | User's primary address (could be JSONB for structured address).             |
| `profile_picture_url`| `TEXT`                     |                                              | URL to the user's profile picture.                                          |
| `email_verified`    | `BOOLEAN`                   | `DEFAULT FALSE`                              | Flag indicating if the user's email has been verified.                      |
| `is_active`         | `BOOLEAN`                   | `DEFAULT TRUE`                               | Flag indicating if the account is active or disabled.                       |
| `last_login`        | `TIMESTAMP WITH TIME ZONE`  |                                              | Timestamp of the user's last login.                                         |
| `created_at`        | `TIMESTAMP WITH TIME ZONE`  | `DEFAULT CURRENT_TIMESTAMP`                  | Timestamp of when the user was created.                                     |
| `updated_at`        | `TIMESTAMP WITH TIME ZONE`  | `DEFAULT CURRENT_TIMESTAMP`                  | Timestamp of when the user was last updated.                                |

**Indexes:**
*   `idx_users_email` on `email`
*   `idx_users_role` on `role`

---

### `products`

Stores information about products listed on the platform.

| Column            | Type                        | Constraints                         | Description                                                                    |
| ----------------- | --------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `id`              | `SERIAL`                    | `PRIMARY KEY`                       | Unique identifier for the product.                                             |
| `name`            | `VARCHAR(255)`              | `NOT NULL`                          | Name of the product.                                                           |
| `description`     | `TEXT`                      |                                     | Detailed description of the product.                                           |
| `price`           | `DECIMAL(10, 2)`            | `NOT NULL`                          | Price of the product.                                                          |
| `sku`             | `VARCHAR(100)`              | `UNIQUE`                            | Stock Keeping Unit.                                                            |
| `stock_quantity`  | `INTEGER`                   | `NOT NULL DEFAULT 0`                | Available quantity in stock.                                                   |
| `vendor_id`       | `INTEGER`                   | `NOT NULL` (FK to `users.id`)       | ID of the vendor (user) who listed the product.                                |
| `category_id`     | `INTEGER`                   | (FK to `categories.id`)             | ID of the product's category.                                                  |
| `images`          | `JSONB`                     |                                     | Array of image URLs or objects (e.g., `[{url: "...", alt: "..."}, ...]`).      |
| `status`          | `VARCHAR(50)`               | `NOT NULL DEFAULT 'pending_approval'` | Status of the product (e.g., 'pending_approval', 'active', 'inactive').        |
| `tags`            | `TEXT[]`                    |                                     | Array of tags for searching/filtering.                                         |
| `ratings_average` | `DECIMAL(3, 2)`             | `DEFAULT 0`                         | Average customer rating.                                                       |
| `ratings_count`   | `INTEGER`                   | `DEFAULT 0`                         | Number of ratings received.                                                    |
| `created_at`      | `TIMESTAMP WITH TIME ZONE`  | `DEFAULT CURRENT_TIMESTAMP`         | Timestamp of when the product was created.                                     |
| `updated_at`      | `TIMESTAMP WITH TIME ZONE`  | `DEFAULT CURRENT_TIMESTAMP`         | Timestamp of when the product was last updated.                                |

**Indexes:**
*   `idx_products_name` on `name`
*   `idx_products_vendor_id` on `vendor_id`
*   `idx_products_category_id` on `category_id`
*   `idx_products_status` on `status`
*   `idx_products_price` on `price`

**Foreign Keys:**
*   `fk_vendor`: `products(vendor_id)` REFERENCES `users(id)` (ON DELETE CASCADE or SET NULL - TBD)
*   `fk_category`: `products(category_id)` REFERENCES `categories(id)` (ON DELETE SET NULL - TBD)

---

### `categories`

(To be defined - will store product categories)

| Column       | Type         | Constraints   | Description                        |
| ------------ | ------------ | ------------- | ---------------------------------- |
| `id`         | `SERIAL`     | `PRIMARY KEY` | Unique identifier for the category. |
| `name`       | `VARCHAR(255)`| `UNIQUE NOT NULL`| Name of the category.             |
| `parent_id`  | `INTEGER`    | (FK to `categories.id`)| For subcategories.        |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of creation.         |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of last update.      |

---

### `orders`

(To be defined - will store customer orders)

---

### `order_items`

(To be defined - will store items within an order)

---

### `deliveries`

(To be defined - will store delivery information)

---

### `recommendations`

(To be defined - will store data for product recommendations)

---

## Relationships

*   A `User` (vendor) can have many `Product`s.
*   A `Product` belongs to one `User` (vendor).
*   A `Product` belongs to one `Category`.
*   A `Category` can have many `Product`s.
*   (Other relationships to be defined as tables are added)

## Migrations

Database schema changes are managed through SQL migration files located in the `database/migrations/` directory.
Each migration file is prefixed with a timestamp or a sequence number to ensure correct order of execution.

The `trigger_set_timestamp()` function and associated triggers are used to automatically update the `updated_at` columns in tables.

```sql
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

This function is then used in triggers like:
```sql
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```
