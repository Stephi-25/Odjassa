-- Migration to create the products table

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(100) UNIQUE, -- Stock Keeping Unit
    stock_quantity INTEGER NOT NULL DEFAULT 0,

    vendor_id INTEGER NOT NULL, -- Will be linked to users table (vendors)
    -- CONSTRAINT fk_vendor FOREIGN KEY(vendor_id) REFERENCES users(id) ON DELETE SET NULL, -- Or ON DELETE CASCADE depending on desired behavior
    -- We will add the foreign key constraint after the users table is confirmed to exist and potentially after a dedicated vendors table if we choose that route.
    -- For now, vendor_id is just an integer.

    category_id INTEGER, -- Will be linked to a categories table
    -- CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,

    images JSONB, -- Store an array of image URLs or objects with more details

    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval', -- e.g., pending_approval, active, inactive, out_of_stock, rejected

    -- Additional product details
    tags TEXT[], -- Array of tags for searching/filtering
    ratings_average DECIMAL(3, 2) DEFAULT 0, -- Average customer rating
    ratings_count INTEGER DEFAULT 0, -- Number of ratings received

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Trigger to update updated_at on row update (using the function created in 001_create_users.sql)
-- Ensure the trigger_set_timestamp function is created before this migration runs if they are run separately.
-- If run in sequence in the same transaction, it should be fine.
CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit, a unique identifier for the product';
COMMENT ON COLUMN products.vendor_id IS 'Identifier for the user (vendor) who listed this product';
COMMENT ON COLUMN products.category_id IS 'Identifier for the product category';
COMMENT ON COLUMN products.images IS 'JSONB array of image URLs or objects (e.g., [{url: "...", alt: "..."}, ...])';
COMMENT ON COLUMN products.status IS 'Current status of the product listing (e.g., pending_approval, active, inactive)';
COMMENT ON COLUMN products.tags IS 'Array of keywords or tags associated with the product';
COMMENT ON COLUMN products.ratings_average IS 'Average rating given by customers, typically on a 1-5 scale';
COMMENT ON COLUMN products.ratings_count IS 'Total number of ratings received for this product';

-- Note: Foreign key constraints for vendor_id and category_id are commented out for now.
-- They should be added in a separate migration script or after confirming the referenced tables (users, categories)
-- and their primary keys are correctly set up. This avoids issues if migrations are run out of order
-- or if the referenced tables are created later.
-- Example for adding FK later:
-- ALTER TABLE products ADD CONSTRAINT fk_vendor FOREIGN KEY(vendor_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE products ADD CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL;
