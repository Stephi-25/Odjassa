-- Migration to create the orders table

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- User who placed the order

    status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
    -- Possible statuses: pending_payment, processing, awaiting_shipment, shipped, delivered, completed, cancelled, refunded, failed

    total_amount DECIMAL(12, 2) NOT NULL, -- Increased precision for total_amount
    currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- Assuming a default currency, adjust as needed

    shipping_address JSONB NOT NULL,
    -- Example: {"name": "John Doe", "street": "123 Main St", "city": "Anytown", "postal_code": "12345", "country": "US", "phone": "555-1234"}

    billing_address JSONB, -- Optional, if different from shipping_address

    payment_method VARCHAR(100),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
    transaction_id VARCHAR(255) UNIQUE, -- Should be unique if present

    shipping_method VARCHAR(100),
    shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
    tracking_number VARCHAR(255),

    estimated_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE, -- Actual delivery timestamp

    notes_to_vendor TEXT, -- Customer's notes for the vendor/order
    internal_notes TEXT, -- Notes for admin/internal use

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id); -- If frequently queried
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);


-- Ensure the trigger function for updated_at exists (created in 001_create_users.sql)
-- CREATE OR REPLACE FUNCTION trigger_set_timestamp()...

-- Trigger to update updated_at on row update
CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

COMMENT ON COLUMN orders.status IS 'Current status of the order (e.g., pending_payment, processing, shipped, delivered, cancelled)';
COMMENT ON COLUMN orders.total_amount IS 'Total monetary value of the order';
COMMENT ON COLUMN orders.currency IS 'Currency code for the total_amount (e.g., USD, EUR)';
COMMENT ON COLUMN orders.shipping_address IS 'JSONB object containing structured shipping address details';
COMMENT ON COLUMN orders.billing_address IS 'JSONB object containing structured billing address details, if different from shipping';
COMMENT ON COLUMN orders.payment_status IS 'Status of the payment for this order (e.g., pending, paid, failed, refunded)';
COMMENT ON COLUMN orders.transaction_id IS 'Unique identifier for the payment transaction, if applicable';
COMMENT ON COLUMN orders.tracking_number IS 'Shipping carrier tracking number, if applicable';
COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when the order was actually delivered';
COMMENT ON COLUMN orders.internal_notes IS 'Internal notes related to the order, visible to staff/admins';
