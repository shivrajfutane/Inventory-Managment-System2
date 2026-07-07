-- ============================================================
-- INVENTORY MANAGEMENT SYSTEM - COMPLETE SQL SCHEMA
-- ============================================================
-- Run this entire file in your Supabase SQL Editor to set up
-- all tables, relationships, RLS policies, and triggers.
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. PROFILES TABLE (extends Supabase Auth users)
-- ============================================================
-- This table stores additional user profile information
-- linked to Supabase Auth's built-in auth.users table.
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase Auth users';

-- ============================================================
-- 3. CATEGORIES TABLE
-- ============================================================
-- Product categories for organizing inventory items
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    color text DEFAULT '#3B82F6',
    icon text DEFAULT 'box',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Product categories for inventory organization';

-- ============================================================
-- 4. SUPPLIERS TABLE
-- ============================================================
-- Stores supplier/vendor information
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    email text,
    phone text,
    address text,
    city text,
    state text,
    country text DEFAULT 'India',
    postal_code text,
    contact_person text,
    website text,
    notes text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.suppliers IS 'Supplier and vendor information';

-- ============================================================
-- 5. PRODUCTS TABLE
-- ============================================================
-- Main product inventory table with references to categories and suppliers
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    sku text NOT NULL UNIQUE,
    description text,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
    quantity integer DEFAULT 0 CHECK (quantity >= 0),
    min_stock_level integer DEFAULT 10 CHECK (min_stock_level >= 0),
    unit_price decimal(10,2) DEFAULT 0.00 CHECK (unit_price >= 0),
    cost_price decimal(10,2) DEFAULT 0.00 CHECK (cost_price >= 0),
    location text,
    image_url text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Main product inventory records';

-- ============================================================
-- 6. INVENTORY TRANSACTIONS TABLE
-- ============================================================
-- Tracks all stock movements: stock in, stock out, adjustments
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment')),
    quantity integer NOT NULL CHECK (quantity > 0),
    previous_stock integer NOT NULL,
    new_stock integer NOT NULL,
    unit_price decimal(10,2),
    total_amount decimal(10,2),
    reference text,
    notes text,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.inventory_transactions IS 'Stock movement history and audit trail';

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================
-- In-app notifications for low stock, updates, etc.
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read boolean DEFAULT false,
    link text,
    created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications and alerts';

-- ============================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================
-- Speed up common queries
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON public.inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.inventory_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS) - ENABLE ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS POLICIES
-- ============================================================

-- PROFILES TABLE POLICIES
-- Users can view all profiles (needed for created_by references)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Admins can update any profile (e.g., to change roles)
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles" 
    ON public.profiles FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- CATEGORIES TABLE POLICIES
-- All authenticated users can view categories
DROP POLICY IF EXISTS "Categories viewable by authenticated users" ON public.categories;
CREATE POLICY "Categories viewable by authenticated users" 
    ON public.categories FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Any authenticated user can insert categories (needed for seeding)
DROP POLICY IF EXISTS "Categories manageable by admin/manager" ON public.categories;
DROP POLICY IF EXISTS "Categories insertable by authenticated users" ON public.categories;
DROP POLICY IF EXISTS "Categories updatable by admin/manager" ON public.categories;
DROP POLICY IF EXISTS "Categories deletable by admin/manager" ON public.categories;
CREATE POLICY "Categories insertable by authenticated users"
    ON public.categories FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories updatable by admin/manager"
    ON public.categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Categories deletable by admin/manager"
    ON public.categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- SUPPLIERS TABLE POLICIES
-- All authenticated users can view suppliers
DROP POLICY IF EXISTS "Suppliers viewable by authenticated users" ON public.suppliers;
CREATE POLICY "Suppliers viewable by authenticated users" 
    ON public.suppliers FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Any authenticated user can insert suppliers (needed for seeding)
DROP POLICY IF EXISTS "Suppliers manageable by admin/manager" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers insertable by authenticated users" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers updatable by admin/manager" ON public.suppliers;
DROP POLICY IF EXISTS "Suppliers deletable by admin/manager" ON public.suppliers;
CREATE POLICY "Suppliers insertable by authenticated users"
    ON public.suppliers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Suppliers updatable by admin/manager"
    ON public.suppliers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Suppliers deletable by admin/manager"
    ON public.suppliers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- PRODUCTS TABLE POLICIES
-- All authenticated users can view products
DROP POLICY IF EXISTS "Products viewable by authenticated users" ON public.products;
CREATE POLICY "Products viewable by authenticated users" 
    ON public.products FOR SELECT 
    USING (auth.role() = 'authenticated');

-- All authenticated users can create products
DROP POLICY IF EXISTS "Products creatable by authenticated users" ON public.products;
CREATE POLICY "Products creatable by authenticated users" 
    ON public.products FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Only admins, managers, or the creator can update products
DROP POLICY IF EXISTS "Products updatable by admin/manager/creator" ON public.products;
CREATE POLICY "Products updatable by admin/manager/creator" 
    ON public.products FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ) OR created_by = auth.uid()
    );

-- Only admins and managers can delete products
DROP POLICY IF EXISTS "Products deletable by admin/manager" ON public.products;
CREATE POLICY "Products deletable by admin/manager" 
    ON public.products FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- INVENTORY TRANSACTIONS TABLE POLICIES
-- All authenticated users can view transactions
DROP POLICY IF EXISTS "Transactions viewable by authenticated users" ON public.inventory_transactions;
CREATE POLICY "Transactions viewable by authenticated users" 
    ON public.inventory_transactions FOR SELECT 
    USING (auth.role() = 'authenticated');

-- All authenticated users can create transactions
DROP POLICY IF EXISTS "Transactions creatable by authenticated users" ON public.inventory_transactions;
CREATE POLICY "Transactions creatable by authenticated users" 
    ON public.inventory_transactions FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- No updates allowed (audit trail) - transactions are immutable
DROP POLICY IF EXISTS "Transactions not updatable" ON public.inventory_transactions;
CREATE POLICY "Transactions not updatable" 
    ON public.inventory_transactions FOR UPDATE 
    USING (false);

-- Only admins can delete (for data cleanup)
DROP POLICY IF EXISTS "Transactions deletable by admin only" ON public.inventory_transactions;
CREATE POLICY "Transactions deletable by admin only" 
    ON public.inventory_transactions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- NOTIFICATIONS TABLE POLICIES
-- Users can only view their own notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" 
    ON public.notifications FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- Users can only update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" 
    ON public.notifications FOR UPDATE 
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- Users can only delete their own notifications
DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" 
    ON public.notifications FOR DELETE 
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- System can create notifications for any user
DROP POLICY IF EXISTS "Notifications creatable by authenticated users" ON public.notifications;
CREATE POLICY "Notifications creatable by authenticated users" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 11. TRIGGERS AND FUNCTIONS
-- ============================================================

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile after user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.email
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        ),
        'user'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile after auth user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create low stock notification
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
BEGIN
    -- Check if stock fell below minimum level
    IF NEW.quantity <= NEW.min_stock_level AND OLD.quantity > OLD.min_stock_level THEN
        INSERT INTO public.notifications (title, message, type)
        VALUES (
            'Low Stock Alert',
            NEW.name || ' (SKU: ' || NEW.sku || ') is running low. Current stock: ' || NEW.quantity,
            'warning'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check low stock on product updates
CREATE TRIGGER trigger_check_low_stock
    AFTER UPDATE ON public.products
    FOR EACH ROW
    WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
    EXECUTE FUNCTION public.check_low_stock();

-- ============================================================
-- 12. STORAGE BUCKETS
-- ============================================================
-- Create a public bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

-- ============================================================
-- 13. SEED DATA - SAMPLE CATEGORIES
-- ============================================================
INSERT INTO public.categories (name, description, color, icon) VALUES
('Electronics', 'Electronic devices and accessories', '#3B82F6', 'cpu'),
('Clothing', 'Apparel and fashion items', '#8B5CF6', 'shirt'),
('Food & Beverages', 'Consumable goods and drinks', '#10B981', 'coffee'),
('Office Supplies', 'Stationery and office equipment', '#F59E0B', 'briefcase'),
('Furniture', 'Office and home furniture', '#EF4444', 'armchair'),
('Tools', 'Hardware and DIY tools', '#6B7280', 'wrench'),
('Books', 'Physical and digital books', '#EC4899', 'book-open'),
('Health & Beauty', 'Personal care products', '#06B6D4', 'heart')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. SEED DATA - SAMPLE SUPPLIERS
-- ============================================================
INSERT INTO public.suppliers (name, email, phone, address, city, state, contact_person, website, status) VALUES
('TechCorp India', 'orders@techcorp.in', '+91-9876543210', '42 Electronics Market', 'New Delhi', 'Delhi', 'Rajesh Kumar', 'www.techcorp.in', 'active'),
('Fashion Hub Ltd', 'contact@fashionhub.com', '+91-9876543211', '15 Textile Nagar', 'Mumbai', 'Maharashtra', 'Priya Sharma', 'www.fashionhub.com', 'active'),
('Fresh Foods Pvt Ltd', 'orders@freshfoods.in', '+91-9876543212', '88 Food Street', 'Bangalore', 'Karnataka', 'Amit Patel', 'www.freshfoods.in', 'active'),
('Office Mart', 'support@officemart.in', '+91-9876543213', '23 Business Park', 'Chennai', 'Tamil Nadu', 'Sneha Reddy', 'www.officemart.in', 'active'),
('Comfort Furniture', 'sales@comfortfurniture.in', '+91-9876543214', '77 Woodworking Lane', 'Hyderabad', 'Telangana', 'Vikram Singh', 'www.comfortfurniture.in', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. USEFUL VIEWS
-- ============================================================

-- View: Product summary with category and supplier names
CREATE OR REPLACE VIEW public.product_summary AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.description,
    p.quantity,
    p.min_stock_level,
    p.unit_price,
    p.cost_price,
    p.image_url,
    p.status,
    p.created_at,
    p.updated_at,
    c.name AS category_name,
    c.color AS category_color,
    s.name AS supplier_name,
    CASE 
        WHEN p.quantity <= p.min_stock_level THEN 'low_stock'
        WHEN p.quantity = 0 THEN 'out_of_stock'
        ELSE 'in_stock'
    END AS stock_status
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
LEFT JOIN public.suppliers s ON p.supplier_id = s.id;

-- View: Monthly transaction summary
CREATE OR REPLACE VIEW public.monthly_transaction_summary AS
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    type,
    COUNT(*) AS transaction_count,
    SUM(quantity) AS total_quantity,
    SUM(total_amount) AS total_amount
FROM public.inventory_transactions
GROUP BY DATE_TRUNC('month', created_at), type
ORDER BY month DESC;

-- View: Low stock products
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT * FROM public.product_summary
WHERE stock_status = 'low_stock' OR stock_status = 'out_of_stock';

-- ============================================================
-- 16. GRANTS AND PERMISSIONS
-- ============================================================
-- Ensure all roles have access to tables, views, and sequences in public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- Instructions:
-- 1. Open your Supabase project SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
-- 4. All tables, policies, triggers, and seed data will be created
-- ============================================================