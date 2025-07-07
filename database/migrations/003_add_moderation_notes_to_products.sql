-- Migration to add moderation_notes column to the products table

ALTER TABLE products
ADD COLUMN moderation_notes TEXT DEFAULT NULL;

COMMENT ON COLUMN products.moderation_notes IS 'Notes or reasons provided by an admin during product moderation (e.g., reason for rejection).';

-- Optional: If you want to ensure this column is also updated by the trigger_set_timestamp function
-- when the row is updated for other reasons, no change is needed to the trigger itself,
-- as it updates based on any row update.

-- If you also want to add a 'rejected_at' timestamp when status becomes 'rejected',
-- that would be a more complex change, potentially requiring modification of the updateStatus logic
-- or a separate trigger for that specific status change. For now, moderation_notes is sufficient.

-- Update existing products' updated_at if this migration is run on an existing table
-- This is often good practice to signify the schema change touched the rows.
-- However, for a simple column addition, it might not be strictly necessary unless other logic depends on it.
-- UPDATE products SET updated_at = CURRENT_TIMESTAMP;
-- For now, let's skip auto-updating all `updated_at` for this simple column addition.
