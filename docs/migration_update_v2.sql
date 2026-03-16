-- Migration script to safely update the database without re-creating tables
-- Run this in your Supabase SQL Editor

-- 1. Safely add columns to Organizations if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='owner_id') THEN
        ALTER TABLE public.organizations ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='is_verified') THEN
        ALTER TABLE public.organizations ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='registration_number') THEN
        ALTER TABLE public.organizations ADD COLUMN registration_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='business_type') THEN
        ALTER TABLE public.organizations ADD COLUMN business_type TEXT;
    END IF;
END $$;

-- 2. Setup Storage for KYB Documents
-- This creates a bucket called 'documents'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies (Idempotent - dropped and recreated)
DROP POLICY IF EXISTS "Users can upload their own KYB docs" ON storage.objects;
CREATE POLICY "Users can upload their own KYB docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own docs" ON storage.objects;
CREATE POLICY "Users can view own docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
