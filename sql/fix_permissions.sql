-- ============================================================
-- QUICK FIX: Permission Denied + RLS Policy Errors
-- ============================================================
-- Run this in your Supabase SQL Editor to fix:
--   - "permission denied for table products/categories/suppliers"
--   - "new row violates row-level security policy for table suppliers"
--   - "new row violates row-level security policy for table categories"
-- ============================================================

-- ── 1. Grant schema access to all roles ──────────────────────
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- ── 2. Fix CATEGORIES RLS policies ───────────────────────────
-- The old "FOR ALL USING(...)" blocked INSERTs silently.
-- Split into separate policies with correct WITH CHECK for INSERT.
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

-- ── 3. Fix SUPPLIERS RLS policies ────────────────────────────
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

-- ── 4. Fix PRODUCTS RLS policies ────────────────────────────
DROP POLICY IF EXISTS "Products deletable by admin/manager" ON public.products;
DROP POLICY IF EXISTS "Products insertable by authenticated users" ON public.products;
DROP POLICY IF EXISTS "Products updatable by admin/manager" ON public.products;

CREATE POLICY "Products insertable by authenticated users"
    ON public.products FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Products updatable by admin/manager"
    ON public.products FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Products deletable by admin/manager"
    ON public.products FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ── 5. Fix STORAGE policies (needed for image upload upsert) ─
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'product-images'
        AND auth.role() = 'authenticated'
    );

-- ── Done ─────────────────────────────────────────────────────
-- After running this, go to Settings → Seed Demo Data
-- to populate categories, suppliers, and products.
-- ============================================================
