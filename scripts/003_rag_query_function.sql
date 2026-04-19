-- =====================================================================
-- RAG query function for hr_knowledge_chunks
-- Run this AFTER 001_initial_schema.sql is applied.
-- =====================================================================

-- Vector similarity search function
create or replace function match_hr_knowledge(
  query_embedding vector(1536),
  match_threshold real default 0.5,
  match_count int default 5
)
returns table (
  id uuid,
  source_title text,
  source_kind text,
  chunk_text text,
  metadata jsonb,
  similarity real
)
language sql stable
as $$
  select
    id,
    source_title,
    source_kind,
    chunk_text,
    metadata,
    (1 - (embedding <=> query_embedding))::real as similarity
  from hr_knowledge_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Grant to authenticated users (via PostgREST RPC)
grant execute on function match_hr_knowledge to authenticated, anon;

-- Quick test (after ingestion):
-- select count(*), source_kind from hr_knowledge_chunks group by source_kind;
