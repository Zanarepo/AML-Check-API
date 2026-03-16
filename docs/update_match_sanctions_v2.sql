-- Migration: Update Match Sanctions Function (v2)
-- Adds support for optional country and entity type filtering.

CREATE OR REPLACE FUNCTION public.match_sanctions (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_country text DEFAULT NULL,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  entity_name TEXT,
  entity_type TEXT,
  source_list TEXT,
  reason_for_sanction TEXT,
  identifiers JSONB,
  source_url TEXT,
  country_of_origin TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sanctions_entities.id,
    sanctions_entities.entity_name,
    sanctions_entities.entity_type,
    sanctions_entities.source_list,
    sanctions_entities.reason_for_sanction,
    sanctions_entities.identifiers,
    sanctions_entities.source_url,
    sanctions_entities.country_of_origin,
    1 - (sanctions_entities.name_embedding <=> query_embedding) AS similarity
  FROM sanctions_entities
  WHERE (1 - (sanctions_entities.name_embedding <=> query_embedding) > match_threshold)
    AND (filter_country IS NULL OR sanctions_entities.country_of_origin = filter_country)
    AND (filter_type IS NULL OR sanctions_entities.entity_type = filter_type)
  ORDER BY sanctions_entities.name_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
