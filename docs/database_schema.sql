-- Supabase Database Schema for AML Check API

-- Enable the pgvector extension for fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Organizations (The B2B Customers)
-- A user can belong to an organization. API keys belong to the organization.
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles (Links auth.users to Organizations)
-- When a user signs in via Google/GitHub, Supabase creates a record in auth.users.
-- We link that to our profiles table to manage their app-specific data.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically create a profile when a new user signs up via Google/GitHub
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. API Keys table
-- Stores the hashed API keys for securely authenticating API requests.
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL, -- NEVER STORE PLAIN TEXT KEYS
    prefix TEXT NOT NULL, -- e.g., 'sk_live_1234'
    name TEXT DEFAULT 'Default Key', -- e.g., 'Production Key'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- 4. Sanctions Entities (The Core Watchlist Data)
-- Stores the scraped data from OFAC, UN, NFIU, EFCC etc.
CREATE TABLE sanctions_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name TEXT NOT NULL,
    -- pgvector column for similarity search (e.g., using OpenAI embeddings or MiniLM)
    name_embedding vector(384), 
    entity_type TEXT CHECK (entity_type IN ('individual', 'entity', 'vessel', 'aircraft')),
    source_list TEXT NOT NULL, -- e.g., 'US_OFAC', 'NIGERIA_NFIU', 'NIGERIA_EFCC'
    country_of_origin TEXT, -- ISO Alpha-2 code, e.g., 'NG', 'US'
    identifiers JSONB DEFAULT '{}'::jsonb, -- DOB, Aliases, Passport numbers
    reason_for_sanction TEXT,
    source_url TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the vector column for much faster fuzzy searching
-- (Assumes you are using cosine similarity `<=>`)
CREATE INDEX ON sanctions_entities USING hnsw (name_embedding vector_cosine_ops);

-- 5. Audit Logs (Compliance Requirement)
-- Logs every API request made by an organization
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    endpoint_accessed TEXT NOT NULL,
    query_parameters JSONB, -- Be careful not to log plain-text unencrypted PII if avoidable
    response_status INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- ROW LEVEL SECURITY (RLS) POLICIES ---
-- Ensures users can only see data belonging to their own organization

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can view their organization
CREATE POLICY "Users can view own organization" 
ON organizations FOR SELECT 
USING (id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- Users can view API keys for their organization
CREATE POLICY "Users can view org api keys" 
ON api_keys FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- Users can view audit logs for their organization
CREATE POLICY "Users can view org audit logs" 
ON audit_logs FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));
