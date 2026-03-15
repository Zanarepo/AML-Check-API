-- SQL for setting up Vector Similarity Search in Supabase

-- 1. Create a function to perform the fuzzy search
-- This function calculates the cosine similarity between the query and stored entity names.
CREATE OR REPLACE FUNCTION match_sanctions (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  entity_name TEXT,
  entity_type TEXT,
  source_list TEXT,
  reason_for_sanction TEXT,
  identifiers JSONB,
  source_url TEXT,
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
    1 - (sanctions_entities.name_embedding <=> query_embedding) AS similarity
  FROM sanctions_entities
  WHERE 1 - (sanctions_entities.name_embedding <=> query_embedding) > match_threshold
  ORDER BY sanctions_entities.name_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
