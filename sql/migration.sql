-- ============================================================
-- INVENTORY MANAGEMENT SYSTEM - MIGRATION SCRIPT
-- ============================================================
-- Run this script in your Supabase SQL Editor to update your 
-- existing database with the latest column additions and policies.
-- ============================================================

-- 1. Add status column to profiles table if it doesn't already exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. Update Row Level Security (RLS) on public.notifications
-- Drop the old policy so we can replace it
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;

-- Create the new policy allowing:
-- A) Users to view their own notifications
-- B) Admins and Managers to view system-wide notifications (where user_id is NULL)
CREATE POLICY "Users and admins view notifications" 
    ON public.notifications FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR (user_id IS NULL AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        ))
    );

-- ============================================================
-- 3. Add missing columns to products table
-- ============================================================

-- cost_price: The purchase/cost price of a product (for margin calculations)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cost_price decimal(10,2) DEFAULT 0.00 CHECK (cost_price >= 0);

-- location: Storage location string (e.g. "Shelf A-3", "Warehouse B")
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS location text;

-- previous_stock / new_stock: Required for inventory transaction audit trail
ALTER TABLE public.inventory_transactions
ADD COLUMN IF NOT EXISTS previous_stock integer NOT NULL DEFAULT 0;

ALTER TABLE public.inventory_transactions
ADD COLUMN IF NOT EXISTS new_stock integer NOT NULL DEFAULT 0;

-- 4. Update handle_new_user trigger function to capture Google profile details (name and avatar/picture)
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

-- 5. Ensure all roles have access to tables, views, and sequences in public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
