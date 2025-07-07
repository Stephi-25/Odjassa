-- Migration to create the order_items table

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE, -- Link to the orders table
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, -- Link to the products table
    -- If product is deleted, product_id becomes NULL. Consider copying essential product info.

    vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- The vendor of this product item
    -- This helps in splitting orders or calculating vendor payouts.

    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10, 2) NOT NULL, -- Price of a single unit at the time of purchase

    -- Denormalized product information for historical record-keeping,
    -- in case the original product details change or product is deleted.
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100), -- Copied SKU
    product_image_url TEXT, -- Copied main image URL

    -- Potentially add product_variant_id if you have product variants
    -- variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    -- variant_details JSONB, -- Copied variant details (e.g., size, color)

    item_status VARCHAR(50) DEFAULT 'pending', -- Status for this specific item within the order
    -- e.g., pending, processing, shipped, delivered, cancelled_by_customer, cancelled_by_vendor, returned
    -- This can be useful for partial shipments or multi-vendor orders.

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint to prevent duplicate product entries within the same order.
    -- If you allow the same product with different variants, this constraint needs adjustment
    -- to be UNIQUE(order_id, product_id, variant_id) perhaps.
    CONSTRAINT unique_order_product_item UNIQUE (order_id, product_id)
    -- This constraint might be too restrictive if, for example, a customer could add the same
    -- product twice as separate line items for some reason (e.g. different customization notes not modeled).
    -- For most e-commerce, quantity handles this.
    -- If variants are introduced, this constraint will need to include variant_id.
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_status ON order_items(item_status);


-- Ensure the trigger function for updated_at exists (created in 001_create_users.sql)
-- CREATE OR REPLACE FUNCTION trigger_set_timestamp()...

-- Trigger to update updated_at on row update
CREATE TRIGGER set_timestamp_order_items
BEFORE UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON COLUMN order_items.order_id IS 'Foreign key referencing the ID of the order this item belongs to.';
COMMENT ON COLUMN order_items.product_id IS 'Foreign key referencing the ID of the product ordered. Can be NULL if product is deleted.';
COMMENT ON COLUMN order_items.vendor_id IS 'Foreign key referencing the ID of the user (vendor) who sells this product.';
COMMENT ON COLUMN order_items.quantity IS 'Number of units of this product ordered.';
COMMENT ON COLUMN order_items.price_at_purchase IS 'Price of a single unit of the product at the time the order was placed.';
COMMENT ON COLUMN order_items.product_name IS 'Denormalized name of the product at the time of purchase.';
COMMENT ON COLUMN order_items.product_sku IS 'Denormalized SKU of the product at the time of purchase.';
COMMENT ON COLUMN order_items.product_image_url IS 'Denormalized URL of the product''s main image at the time of purchase.';
COMMENT ON COLUMN order_items.item_status IS 'Status of this specific item within the order (e.g., processing, shipped).';
COMMENT ON CONSTRAINT unique_order_product_item ON order_items IS 'Ensures that a product appears only once per order; quantity should be used for multiple units of the same product.';
