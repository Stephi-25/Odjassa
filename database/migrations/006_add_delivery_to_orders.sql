-- Migration to add delivery_person_id to orders table and refine statuses

ALTER TABLE orders
ADD COLUMN delivery_person_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_delivery_person_id ON orders(delivery_person_id);

COMMENT ON COLUMN orders.delivery_person_id IS 'Foreign key referencing the ID of the user (delivery_person) assigned to deliver this order.';

-- Revising comment for the status column to reflect delivery statuses.
-- The actual ENUM or CHECK constraint for statuses would be more robust but for now, a comment update.
COMMENT ON COLUMN orders.status IS 'Current status of the order (e.g., pending_payment, processing, ready_for_delivery, awaiting_pickup, out_for_delivery, delivered, delivery_failed, completed, cancelled, refunded, failed)';

-- No change to payment_status column comment as it's separate.

-- Optional: Add a new status like 'ready_for_delivery' if 'awaiting_shipment' is not granular enough
-- or if 'processing' directly leads to 'awaiting_pickup' by a delivery person.
-- For now, we assume 'awaiting_shipment' can be used or a similar existing status like 'processing'
-- can mean it's ready for a delivery person to be assigned or to pick it up.
-- Let's assume for now the flow could be:
-- processing -> ready_for_delivery (set by vendor/admin)
-- ready_for_delivery -> awaiting_pickup (set when delivery_person_id is assigned)
-- awaiting_pickup -> out_for_delivery (set by delivery_person when they pick up)
-- out_for_delivery -> delivered / delivery_failed (set by delivery_person)

-- If we want to be very specific, we might add a dedicated `delivery_status` field,
-- but for MVP, using the main `status` field and extending its possible values is simpler.
-- The chosen statuts for the comment are:
-- 'pending_payment', 'processing', 'ready_for_delivery',
-- 'awaiting_pickup', 'out_for_delivery', 'delivered', 'delivery_failed',
-- 'completed', 'cancelled', 'refunded', 'failed'

-- To make 'ready_for_delivery' a distinct step after 'processing',
-- applications would transition orders to this state when all items are prepared.
-- Then delivery persons would see orders in 'ready_for_delivery'.
-- When a delivery person claims/is assigned an order, it could move to 'awaiting_pickup'.
-- When they physically get it, 'out_for_delivery'.
-- Then 'delivered' or 'delivery_failed'.
-- 'completed' would be a final state post-delivery if no issues.

-- No change to existing default 'pending_payment' for new orders.
-- The application logic will handle transitions.
UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE delivery_person_id IS NOT NULL; -- Just an example if needed
-- For now, let's skip auto-updating all `updated_at` for this schema addition.
