-- SAFE FIX FOR RLS POLICIES ON ORGANIZATIONS
-- This allows users to create and manage their own organizations

-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow users to CREATE an organization where they are the owner
DROP POLICY IF EXISTS "Users can create their own organization" ON public.organizations;
CREATE POLICY "Users can create their own organization"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- 3. Policy: Allow users to UPDATE their own organization
DROP POLICY IF EXISTS "Users can update their own organization" ON public.organizations;
CREATE POLICY "Users can update their own organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 4. Policy: Allow users to VIEW their own organization
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- 5. PROFILE Update Policy
-- Allow users to update their own profile (necessary to link the org_id)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
