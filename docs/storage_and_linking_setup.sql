-- Supabase Schema Update: Linking Organizations to Profiles and Setting up Storage

-- 1. Update Organizations Table to include an Owner link
ALTER TABLE public.organizations 
ADD COLUMN owner_id UUID REFERENCES public.profiles(id);

-- 2. Update the handle_new_user function to Automate Organization Creation
-- This ensures every new signup immediately gets their own "Sandbox" organization.

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- A. Create the Organization first
  INSERT INTO public.organizations (name, plan_tier)
  VALUES (user_full_name || ' Organization', 'free')
  RETURNING id INTO new_org_id;

  -- B. Create the Profile and link it to the newly created Organization
  INSERT INTO public.profiles (id, email, full_name, avatar_url, organization_id)
  VALUES (
    new.id, 
    new.email, 
    user_full_name,
    new.raw_user_meta_data->>'avatar_url',
    new_org_id
  );

  -- C. Update the Organization to set this user as the owner
  UPDATE public.organizations 
  SET owner_id = new.id 
  WHERE id = new_org_id;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Setup Storage for KYB Documents
-- This creates a bucket called 'documents' for Certificate of Incorporation etc.

-- Insert bucket into storage.buckets (Note: This might need to be run manually if your Supabase setup is strict, but usually works in SQL editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Allow users to upload to their own folder within the bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to see their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow platform admins/system to see all documents for review
-- (Assuming we have a way to identify admins, for now we let owners see their own)
