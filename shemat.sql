-- ====================================
-- Base de données ÔDjassa.net
-- Schéma complet avec indexes et contraintes
-- ====================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour recherche textuelle

-- ====================================
-- TABLES PRINCIPALES
-- ====================================

-- Table des utilisateurs (base commune)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'vendor', 'delivery', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image_url TEXT,
    -- Colonnes RGPD
    consent_marketing BOOLEAN DEFAULT FALSE,
    consent_analytics BOOLEAN DEFAULT FALSE,
    data_retention_until DATE
);

-- Table des vendeurs
CREATE TABLE vendors (
    vendor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_registration VARCHAR(100) UNIQUE,
    business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('individual', 'company')),
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('commission', 'monthly')),
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_date TIMESTAMP WITH TIME ZONE,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des livreurs
CREATE TABLE delivery_agents (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('bike', 'car', 'truck')),
    service_zones JSONB, -- Zones géographiques couvertes
    availability_status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories (hiérarchique)
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES categories(category_id) ON DELETE SET NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des articles
CREATE TABLE articles (
    article_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(category_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    currency CHAR(3) DEFAULT 'XOF',
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    min_order_quantity INTEGER DEFAULT 1 CHECK (min_order_quantity > 0),
    weight DECIMAL(8,2) DEFAULT 0.00,
    dimensions JSONB, -- {length, width, height}
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'inactive')),
    validation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    -- Index de recherche textuelle
    search_vector TSVECTOR
);

-- Table des images d'articles
CREATE TABLE article_images (
    image_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des variantes d'articles
CREATE TABLE article_variants (
    variant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES articles(article_id) ON DELETE CASCADE,
    variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('size', 'color', 'material', 'style')),
    variant_value VARCHAR(100) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des commandes
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(user_id),
    vendor_id UUID NOT NULL REFERENCES vendors(vendor_id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount >= 0),
    commission_amount DECIMAL(15,2) DEFAULT 0.00,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('card', 'mobile_money', 'cash_on_delivery')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    delivery_address JSONB NOT NULL,
    delivery_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Table des détails de commande
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(article_id),
    variant_id UUID REFERENCES article_variants(variant_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des livraisons
CREATE TABLE deliveries (
    delivery_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    delivery_agent_id UUID REFERENCES delivery_agents(delivery_id),
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    delivery_notes TEXT,
    signature_url TEXT,
    gps_coordinates JSONB, -- {lat, lng}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des conversations
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id),
    client_id UUID NOT NULL REFERENCES users(user_id),
    agent_id UUID REFERENCES users(user_id),
    vendor_id UUID REFERENCES vendors(vendor_id),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(user_id),
    message_content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    is_internal BOOLEAN DEFAULT FALSE
);

-- Table des notifications
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('order_received', 'order_status', 'message', 'system')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Table de tracking comportemental
CREATE TABLE user_behavior (
    behavior_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'search', 'cart_add', 'purchase', 'like')),
    article_id UUID REFERENCES articles(article_id),
    search_query TEXT,
    category_id UUID REFERENCES categories(category_id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Table des avis clients
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    client_id UUID NOT NULL REFERENCES users(user_id),
    vendor_id UUID NOT NULL REFERENCES vendors(vendor_id),
    article_id UUID NOT NULL REFERENCES articles(article_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    moderated_at TIMESTAMP WITH TIME ZONE
);

-- Table des transactions de paiement
CREATE TABLE payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency CHAR(3) NOT NULL DEFAULT 'XOF',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    external_transaction_id VARCHAR(255),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des logs d'administration
CREATE TABLE admin_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- ====================================
-- INDEXES STRATÉGIQUES
-- ====================================

-- Index pour l'authentification
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type_status ON users(user_type, status);

-- Index pour les recherches d'articles
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_vendor ON articles(vendor_id);
CREATE INDEX idx_articles_featured ON articles(featured) WHERE featured = true;
CREATE INDEX idx_articles_price ON articles(price);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- Index de recherche textuelle
CREATE INDEX idx_articles_search ON articles USING gin(search_vector);
CREATE INDEX idx_articles_title_trigram ON articles USING gin(title gin_trgm_ops);

-- Index pour les commandes
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);

-- Index pour les conversations
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at);

-- Index pour les notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Index pour le tracking comportemental (partitionné par date)
CREATE INDEX idx_user_behavior_user_timestamp ON user_behavior(user_id, timestamp DESC);
CREATE INDEX idx_user_behavior_session ON user_behavior(session_id);
CREATE INDEX idx_user_behavior_article ON user_behavior(article_id);

-- Index pour les livraisons
CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_agent ON deliveries(delivery_agent_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- ====================================
-- TRIGGERS ET FONCTIONS
-- ====================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_agents_updated_at BEFORE UPDATE ON delivery_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer les numéros de commande
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $
BEGIN
    NEW.order_number = 'ODJ' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::text, 6, '0');
    RETURN NEW;
END;
$ language 'plpgsql';

-- Séquence pour les numéros de commande
CREATE SEQUENCE order_number_seq START 1;

-- Trigger pour générer automatiquement les numéros de commande
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_order_number();

-- Fonction pour mettre à jour le vecteur de recherche
CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $
BEGIN
    NEW.search_vector = to_tsvector('french', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
    RETURN NEW;
END;
$ language 'plpgsql';

-- Trigger pour la recherche textuelle
CREATE TRIGGER update_article_search_vector_trigger
    BEFORE INSERT OR UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_search_vector();

-- Fonction pour valider la cohérence des totaux de commande
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $
DECLARE
    calculated_total DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(total_price), 0) INTO calculated_total
    FROM order_items
    WHERE order_id = NEW.order_id;
    
    IF calculated_total != NEW.total_amount THEN
        RAISE EXCEPTION 'Le total de la commande (%) ne correspond pas à la somme des articles (%)', 
                        NEW.total_amount, calculated_total;
    END IF;
    
    RETURN NEW;
END;
$ language 'plpgsql';

-- Trigger pour valider les totaux (après insertion/update des items)
CREATE TRIGGER validate_order_total_trigger
    BEFORE UPDATE OF total_amount ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_total();

-- Fonction pour mettre à jour les statistiques vendeur
CREATE OR REPLACE FUNCTION update_vendor_stats()
RETURNS TRIGGER AS $
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE vendors SET
            total_sales = total_sales + NEW.total_amount
        WHERE vendor_id = NEW.vendor_id;
    END IF;
    
    RETURN NEW;
END;
$ language 'plpgsql';

-- Trigger pour les statistiques vendeur
CREATE TRIGGER update_vendor_stats_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_stats();

-- ====================================
-- VUES MATÉRIALISÉES
-- ====================================

-- Vue pour les statistiques des articles
CREATE MATERIALIZED VIEW mv_article_stats AS
SELECT 
    a.article_id,
    a.title,
    a.vendor_id,
    a.category_id,
    a.price,
    a.view_count,
    COUNT(DISTINCT oi.order_id) as total_orders,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(r.rating) as avg_rating,
    COUNT(r.review_id) as review_count,
    a.created_at
FROM articles a
LEFT JOIN order_items oi ON a.article_id = oi.article_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status = 'delivered'
LEFT JOIN reviews r ON a.article_id = r.article_id
GROUP BY a.article_id, a.title, a.vendor_id, a.category_id, a.price, a.view_count, a.created_at;

-- Index sur la vue matérialisée
CREATE INDEX idx_mv_article_stats_vendor ON mv_article_stats(vendor_id);
CREATE INDEX idx_mv_article_stats_category ON mv_article_stats(category_id);
CREATE INDEX idx_mv_article_stats_revenue ON mv_article_stats(total_revenue DESC);

-- Vue pour les recommandations (articles populaires par catégorie)
CREATE MATERIALIZED VIEW mv_category_trending AS
SELECT 
    c.category_id,
    c.name as category_name,
    a.article_id,
    a.title,
    a.price,
    COUNT(ub.behavior_id) as interaction_count,
    AVG(r.rating) as avg_rating
FROM categories c
JOIN articles a ON c.category_id = a.category_id
LEFT JOIN user_behavior ub ON a.article_id = ub.article_id 
    AND ub.timestamp >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN reviews r ON a.article_id = r.article_id
WHERE a.status = 'approved'
GROUP BY c.category_id, c.name, a.article_id, a.title, a.price
ORDER BY c.category_id, interaction_count DESC;

-- ====================================
-- FONCTIONS MÉTIER
-- ====================================

-- Fonction pour calculer la distance de livraison (simplifiée)
CREATE OR REPLACE FUNCTION calculate_delivery_distance(
    vendor_location JSONB,
    delivery_location JSONB
) RETURNS DECIMAL AS $
DECLARE
    lat1 DECIMAL := (vendor_location->>'lat')::DECIMAL;
    lon1 DECIMAL := (vendor_location->>'lng')::DECIMAL;
    lat2 DECIMAL := (delivery_location->>'lat')::DECIMAL;
    lon2 DECIMAL := (delivery_location->>'lng')::DECIMAL;
    distance DECIMAL;
BEGIN
    -- Formule de Haversine simplifiée (approximation)
    distance := 6371 * acos(
        cos(radians(lat1)) * cos(radians(lat2)) * 
        cos(radians(lon2) - radians(lon1)) + 
        sin(radians(lat1)) * sin(radians(lat2))
    );
    
    RETURN distance;
END;
$ LANGUAGE plpgsql;

-- Fonction pour calculer les frais de livraison
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
    distance_km DECIMAL,
    order_total DECIMAL
) RETURNS DECIMAL AS $
DECLARE
    base_fee DECIMAL := 1000.00; -- Frais de base en XOF
    per_km_fee DECIMAL := 100.00; -- Frais par km
    free_delivery_threshold DECIMAL := 25000.00; -- Livraison gratuite au dessus de ce montant
BEGIN
    -- Livraison gratuite pour les grosses commandes
    IF order_total >= free_delivery_threshold THEN
        RETURN 0.00;
    END IF;
    
    -- Calcul des frais selon la distance
    RETURN base_fee + (distance_km * per_km_fee);
END;
$ LANGUAGE plpgsql;

-- Fonction pour obtenir les recommandations personnalisées
CREATE OR REPLACE FUNCTION get_user_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    article_id UUID,
    title VARCHAR(255),
    price DECIMAL(10,2),
    category_name VARCHAR(255),
    relevance_score DECIMAL
) AS $
BEGIN
    RETURN QUERY
    WITH user_categories AS (
        -- Catégories fréquemment consultées par l'utilisateur
        SELECT ub.category_id, COUNT(*) as interaction_count
        FROM user_behavior ub
        WHERE ub.user_id = p_user_id
        AND ub.timestamp >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ub.category_id
        ORDER BY interaction_count DESC
        LIMIT 5
    ),
    similar_users AS (
        -- Utilisateurs avec des comportements similaires
        SELECT ub2.user_id, COUNT(*) as common_articles
        FROM user_behavior ub1
        JOIN user_behavior ub2 ON ub1.article_id = ub2.article_id
        WHERE ub1.user_id = p_user_id
        AND ub2.user_id != p_user_id
        AND ub1.timestamp >= CURRENT_DATE - INTERVAL '30 days'
        AND ub2.timestamp >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY ub2.user_id
        ORDER BY common_articles DESC
        LIMIT 20
    )
    SELECT 
        a.article_id,
        a.title,
        a.price,
        c.name as category_name,
        (
            CASE WHEN uc.category_id IS NOT NULL THEN 3.0 ELSE 1.0 END +
            COALESCE(mas.total_orders, 0) * 0.1 +
            COALESCE(mas.avg_rating, 0) * 0.5
        ) as relevance_score
    FROM articles a
    JOIN categories c ON a.category_id = c.category_id
    LEFT JOIN user_categories uc ON a.category_id = uc.category_id
    LEFT JOIN mv_article_stats mas ON a.article_id = mas.article_id
    WHERE a.status = 'approved'
    AND a.stock_quantity > 0
    AND a.article_id NOT IN (
        -- Exclure les articles déjà achetés
        SELECT DISTINCT oi.article_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.client_id = p_user_id
    )
    ORDER BY relevance_score DESC
    LIMIT p_limit;
END;
$ LANGUAGE plpgsql;

-- ====================================
-- DONNÉES D'EXEMPLE
-- ====================================

-- Insertion des données de test
INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type) VALUES
('admin@odjassa.net', '$2b$12$example_hash', 'Admin', 'Principal', '+2250123456789', 'admin'),
('vendeur1@example.com', '$2b$12$example_hash', 'Jean', 'Kouassi', '+2250123456790', 'vendor'),
('client1@example.com', '$2b$12$example_hash', 'Marie', 'Traoré', '+2250123456791', 'client'),
('livreur1@example.com', '$2b$12$example_hash', 'Pierre', 'Diabaté', '+2250123456792', 'delivery');

-- Insertion d'un vendeur
INSERT INTO vendors (user_id, business_name, business_registration, business_type, subscription_type, commission_rate, verification_status)
SELECT user_id, 'Boutique Kouassi', 'REG001', 'individual', 'commission', 5.00, 'verified'
FROM users WHERE email = 'vendeur1@example.com';

-- Insertion d'un livreur
INSERT INTO delivery_agents (user_id, license_number, vehicle_type, service_zones, availability_status)
SELECT user_id, 'LIC001', 'bike', '["Cocody", "Marcory", "Treichville"]'::jsonb, 'available'
FROM users WHERE email = 'livreur1@example.com';

-- Insertion des catégories
INSERT INTO categories (name, description, sort_order) VALUES
('Électronique', 'Smartphones, ordinateurs, accessoires', 1),
('Mode', 'Vêtements, chaussures, accessoires', 2),
('Maison & Jardin', 'Mobilier, décoration, jardinage', 3),
('Sport & Loisirs', 'Équipements sportifs, jeux', 4);

-- Insertion d'articles d'exemple
INSERT INTO articles (vendor_id, category_id, title, description, price, stock_quantity, status)
SELECT 
    v.vendor_id,
    c.category_id,
    'iPhone 15 Pro Max',
    'Smartphone Apple dernière génération, 256GB, couleur Titane Naturel',
    850000.00,
    5,
    'approved'
FROM vendors v, categories c
WHERE v.business_name = 'Boutique Kouassi'
AND c.name = 'Électronique';

INSERT INTO articles (vendor_id, category_id, title, description, price, stock_quantity, status)
SELECT 
    v.vendor_id,
    c.category_id,
    'Robe Africaine Wax',
    'Magnifique robe en tissu wax, taille unique, motifs traditionnels',
    25000.00,
    10,
    'approved'
FROM vendors v, categories c
WHERE v.business_name = 'Boutique Kouassi'
AND c.name = 'Mode';

-- ====================================
-- POLITIQUES DE SÉCURITÉ RLS
-- ====================================

-- Activation du Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs (peuvent voir leurs propres données)
CREATE POLICY users_own_data ON users
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour les vendeurs (peuvent voir leurs propres données)
CREATE POLICY vendors_own_data ON vendors
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour les commandes (clients voient leurs commandes, vendeurs voient les leurs)
CREATE POLICY orders_access ON orders
    FOR SELECT
    USING (
        client_id = current_setting('app.current_user_id')::UUID OR
        vendor_id IN (
            SELECT vendor_id FROM vendors 
            WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- ====================================
-- PROCÉDURES STOCKÉES MÉTIER
-- ====================================

-- Procédure pour créer une commande complète
CREATE OR REPLACE FUNCTION create_order(
    p_client_id UUID,
    p_vendor_id UUID,
    p_items JSONB, -- [{"article_id": "...", "variant_id": "...", "quantity": 2}]
    p_delivery_address JSONB,
    p_payment_method VARCHAR(30),
    p_delivery_instructions TEXT DEFAULT NULL
) RETURNS UUID AS $
DECLARE
    v_order_id UUID;
    v_total_amount DECIMAL(15,2) := 0;
    v_item JSONB;
    v_article_price DECIMAL(10,2);
    v_item_total DECIMAL(10,2);
BEGIN
    -- Création de la commande
    INSERT INTO orders (client_id, vendor_id, total_amount, payment_method, delivery_address, delivery_instructions)
    VALUES (p_client_id, p_vendor_id, 0, p_payment_method, p_delivery_address, p_delivery_instructions)
    RETURNING order_id INTO v_order_id;
    
    -- Insertion des articles
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Récupération du prix de l'article
        SELECT price INTO v_article_price
        FROM articles
        WHERE article_id = (v_item->>'article_id')::UUID;
        
        v_item_total := v_article_price * (v_item->>'quantity')::INTEGER;
        v_total_amount := v_total_amount + v_item_total;
        
        -- Insertion de l'item
        INSERT INTO order_items (order_id, article_id, variant_id, quantity, unit_price, total_price)
        VALUES (
            v_order_id,
            (v_item->>'article_id')::UUID,
            CASE WHEN v_item->>'variant_id' = 'null' THEN NULL ELSE (v_item->>'variant_id')::UUID END,
            (v_item->>'quantity')::INTEGER,
            v_article_price,
            v_item_total
        );
    END LOOP;
    
    -- Mise à jour du total
    UPDATE orders SET total_amount = v_total_amount WHERE order_id = v_order_id;
    
    -- Création d'une notification pour le vendeur
    INSERT INTO notifications (user_id, type, title, content, action_url)
    SELECT 
        v.user_id,
        'order_received',
        'Nouvelle commande reçue',
        'Vous avez reçu une nouvelle commande d''un montant de ' || v_total_amount || ' XOF',
        '/vendor/orders/' || v_order_id
    FROM vendors v
    WHERE v.vendor_id = p_vendor_id;
    
    RETURN v_order_id;
END;
$ LANGUAGE plpgsql;

-- ====================================
-- INDEXES ADDITIONNELS POUR PERFORMANCE
-- ====================================

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_articles_category_status_price ON articles(category_id, status, price);
CREATE INDEX idx_orders_vendor_status_created ON orders(vendor_id, status, created_at DESC);
CREATE INDEX idx_user_behavior_user_event_timestamp ON user_behavior(user_id, event_type, timestamp DESC);

-- Index partiel pour les articles en stock
CREATE INDEX idx_articles_in_stock ON articles(category_id, price) WHERE status = 'approved' AND stock_quantity > 0;

-- Index pour les recherches géographiques (si extension PostGIS disponible)
-- CREATE INDEX idx_delivery_zones ON delivery_agents USING gin(service_zones);

-- ====================================
-- REFRESH DES VUES MATÉRIALISÉES
-- ====================================

-- Fonction pour rafraîchir les vues matérialisées
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_article_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_trending;
END;
$ LANGUAGE plpgsql;

-- ====================================
-- CONFIGURATION FINALE
-- ====================================

-- Configuration des paramètres PostgreSQL recommandés
-- (À adapter selon l'environnement de production)

-- COMMENT : Augmenter shared_buffers à 25% de la RAM
-- COMMENT : Configurer work_mem selon la charge (4MB-16MB)
-- COMMENT : Activer log_statement = 'mod' pour l'audit
-- COMMENT : Configurer checkpoint_completion_target = 0.9
