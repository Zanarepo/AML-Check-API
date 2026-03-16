-- Migration: Plan Tiers & Resource Restrictions
-- This script is fully idempotent and focuses ONLY on Plan-related schema updates.

-- 1. Ensure Extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Plan Tiers Table
CREATE TABLE IF NOT EXISTS public.plan_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    monthly_limit INTEGER NOT NULL DEFAULT 1000,
    price_monthly DECIMAL(10, 2) DEFAULT 0.00,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed/Update Plan Data (Idempotent Upsert)
INSERT INTO public.plan_tiers (name, monthly_limit, price_monthly, features) VALUES
('Free', 1000, 0.00, '{"show_details": false, "can_filter_country": false}'),
('Pro', 5000, 49.00, '{"show_details": true, "can_filter_country": true, "api_access": true}'),
('Enterprise', 50000, 299.00, '{"show_details": true, "can_filter_country": true, "api_access": true, "priority_support": true, "custom_lists": true}')
ON CONFLICT (name) DO UPDATE SET
    monthly_limit = EXCLUDED.monthly_limit,
    price_monthly = EXCLUDED.price_monthly,
    features = EXCLUDED.features;

-- 4. Update Organizations Table (Safely add foreign key)
DO $$ 
BEGIN 
    -- Add column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='plan_tier_id') THEN
        ALTER TABLE public.organizations ADD COLUMN plan_tier_id UUID REFERENCES public.plan_tiers(id);
    END IF;
END $$;

-- Link any existing tier-less organizations to the Free plan
UPDATE public.organizations 
SET plan_tier_id = (SELECT id FROM public.plan_tiers WHERE name = 'Free')
WHERE plan_tier_id IS NULL;

-- 5. Enhanced Signup Trigger (Auto-creates Org with Free Plan)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  free_plan_id UUID;
BEGIN
  -- Get the ID of the Free plan
  SELECT id INTO free_plan_id FROM public.plan_tiers WHERE name = 'Free';

  -- Create a default organization for the user
  INSERT INTO public.organizations (name, plan_tier_id)
  VALUES (COALESCE(new.raw_user_meta_data->>'full_name', 'My') || ' Org', free_plan_id)
  RETURNING id INTO new_org_id;

  -- Create the profile linked to the new org
  INSERT INTO public.profiles (id, email, full_name, avatar_url, organization_id)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new_org_id
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-assign the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Row Level Security Policies
ALTER TABLE public.plan_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plan tiers are viewable by all" ON public.plan_tiers;
CREATE POLICY "Plan tiers are viewable by all" ON public.plan_tiers FOR SELECT USING (true);

-- Ensure organization members can view their plan details even if profile is in another schema
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations FOR SELECT 
USING (id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));
