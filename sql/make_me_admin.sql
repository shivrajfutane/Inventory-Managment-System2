-- ============================================================
-- STEP 1: MAKE ME ADMIN + FIX RLS RECURSION
-- ============================================================
-- Run this ENTIRE file in your Supabase SQL Editor.
-- It will:
--   1. Create SECURITY DEFINER helper functions (fixes RLS recursion)
--   2. Re-create all role-checking policies using those functions
--   3. Promote YOUR account to admin
-- ============================================================


-- ── PART A: Create SECURITY DEFINER helper functions ──────────
-- These bypass RLS when checking roles, preventing infinite recursion.

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── PART B: Fix PROFILES policies (were causing recursion) ────

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());    -- uses SECURITY DEFINER, no recursion


-- ── PART C: Fix PRODUCTS policies ─────────────────────────────

DROP POLICY IF EXISTS "Products viewable by authenticated users" ON public.products;
CREATE POLICY "Products viewable by authenticated users"
    ON public.products FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Products creatable by authenticated users" ON public.products;
CREATE POLICY "Products creatable by authenticated users"
    ON public.products FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Products updatable by admin/manager/creator" ON public.products;
CREATE POLICY "Products updatable by admin/manager/creator"
    ON public.products FOR UPDATE
    USING (public.is_admin_or_manager() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Products deletable by admin/manager" ON public.products;
CREATE POLICY "Products deletable by admin/manager"
    ON public.products FOR DELETE
    USING (public.is_admin_or_manager());


-- ── PART D: Fix CATEGORIES policies ───────────────────────────

DROP POLICY IF EXISTS "Categories viewable by authenticated users" ON public.categories;
CREATE POLICY "Categories viewable by authenticated users"
    ON public.categories FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Categories insertable by authenticated users" ON public.categories;
CREATE POLICY "Categories insertable by authenticated users"
    ON public.categories FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Categories updatable by admin/manager" ON public.categories;
CREATE POLICY "Categories updatable by admin/manager"
    ON public.categories FOR UPDATE
    USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Categories deletable by admin/manager" ON public.categories;
CREATE POLICY "Categories deletable by admin/manager"
    ON public.categories FOR DELETE
    USING (public.is_admin_or_manager());


-- ── PART E: Fix SUPPLIERS policies ────────────────────────────

DROP POLICY IF EXISTS "Suppliers viewable by authenticated users" ON public.suppliers;
CREATE POLICY "Suppliers viewable by authenticated users"
    ON public.suppliers FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Suppliers insertable by authenticated users" ON public.suppliers;
CREATE POLICY "Suppliers insertable by authenticated users"
    ON public.suppliers FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Suppliers updatable by admin/manager" ON public.suppliers;
CREATE POLICY "Suppliers updatable by admin/manager"
    ON public.suppliers FOR UPDATE
    USING (public.is_admin_or_manager());

DROP POLICY IF EXISTS "Suppliers deletable by admin/manager" ON public.suppliers;
CREATE POLICY "Suppliers deletable by admin/manager"
    ON public.suppliers FOR DELETE
    USING (public.is_admin_or_manager());


-- ── PART F: Fix TRANSACTIONS policies ─────────────────────────

DROP POLICY IF EXISTS "Transactions viewable by authenticated users" ON public.inventory_transactions;
CREATE POLICY "Transactions viewable by authenticated users"
    ON public.inventory_transactions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Transactions creatable by authenticated users" ON public.inventory_transactions;
CREATE POLICY "Transactions creatable by authenticated users"
    ON public.inventory_transactions FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Transactions not updatable" ON public.inventory_transactions;
CREATE POLICY "Transactions not updatable"
    ON public.inventory_transactions FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "Transactions deletable by admin only" ON public.inventory_transactions;
CREATE POLICY "Transactions deletable by admin only"
    ON public.inventory_transactions FOR DELETE
    USING (public.is_admin());


-- ── PART G: Fix NOTIFICATIONS policies ────────────────────────

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    USING (
        auth.uid() = user_id
        OR (user_id IS NULL AND public.is_admin_or_manager())
    );

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (user_id IS NULL AND public.is_admin_or_manager())
    );

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications"
    ON public.notifications FOR DELETE
    USING (
        auth.uid() = user_id
        OR (user_id IS NULL AND public.is_admin_or_manager())
    );

DROP POLICY IF EXISTS "Notifications creatable by authenticated users" ON public.notifications;
CREATE POLICY "Notifications creatable by authenticated users"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');


-- ── PART H: Grant function permissions ────────────────────────
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;


-- ── PART I: PROMOTE YOURSELF TO ADMIN ─────────────────────────
-- Step 1: Create profile rows for any auth users that don't have one yet.
-- (This fixes the case where the handle_new_user trigger did not fire.)
INSERT INTO public.profiles (id, full_name, role, status)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    'admin',
    'active'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Set ALL existing profiles to admin.
-- (Change this to target a specific email if you have multiple users.)
UPDATE public.profiles
SET role = 'admin';

-- ============================================================
-- Done! After running this:
-- 1. Refresh/reload the app (http://localhost:5175)
-- 2. "Admin Panel" will appear in the sidebar
-- 3. You can manage user roles from the Admin Panel
-- ============================================================


