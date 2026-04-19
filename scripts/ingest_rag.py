"""
ingest_rag.py
=============
Ingest Perka BPKH chunks into Supabase pgvector for Tanya HR RAG.

Uses Jina AI embeddings (free tier, open source, 1536-dim compatible).
Alternative: OpenAI text-embedding-3-small, Cohere embed-v3, or local
Sentence-Transformers (all-MiniLM-L6-v2 with dim adjustment).

USAGE:
    export SUPABASE_URL=https://dstkhzgebjtwvsfykidt.supabase.co
    export SUPABASE_SERVICE_KEY=...
    export JINA_API_KEY=...  # get free at https://jina.ai/embeddings
    python scripts/ingest_rag.py

To use OpenAI instead:
    export OPENAI_API_KEY=...
    python scripts/ingest_rag.py --provider openai
"""

import os
import json
import sys
import argparse
import time
from pathlib import Path

import httpx
from supabase import create_client


def get_embedding_jina(text: str, api_key: str) -> list[float]:
    """Jina AI embeddings (1024-dim, we'll pad to 1536)."""
    resp = httpx.post(
        "https://api.jina.ai/v1/embeddings",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "jina-embeddings-v3",
            "task": "retrieval.passage",
            "input": [text],
            "dimensions": 1536,  # v3 supports 1536 via matryoshka
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]


def get_embedding_openai(text: str, api_key: str) -> list[float]:
    """OpenAI text-embedding-3-small (1536-dim native)."""
    resp = httpx.post(
        "https://api.openai.com/v1/embeddings",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "text-embedding-3-small", "input": text},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]


def get_embedding_local(text: str) -> list[float]:
    """Local fallback using sentence-transformers."""
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("✗ sentence-transformers not installed. Run: pip install sentence-transformers")
        sys.exit(1)

    global _local_model
    if "_local_model" not in globals() or _local_model is None:
        print("  Loading local model (first run)...")
        _local_model = SentenceTransformer("intfloat/multilingual-e5-large")
    vec = _local_model.encode(f"passage: {text}", normalize_embeddings=True).tolist()

    # Pad or truncate to 1536 dims to match schema
    if len(vec) < 1536:
        vec = vec + [0.0] * (1536 - len(vec))
    elif len(vec) > 1536:
        vec = vec[:1536]
    return vec


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", default="jina", choices=["jina", "openai", "local"])
    parser.add_argument(
        "--chunks-file",
        default=str(Path(__file__).parent.parent / "data" / "knowledge_base" / "perka_bpkh_chunks.json"),
    )
    parser.add_argument("--clear", action="store_true", help="Delete existing chunks first")
    args = parser.parse_args()

    # Supabase client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("✗ Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")
        sys.exit(1)

    sb = create_client(url, key)

    # API key for embedding provider
    if args.provider == "jina":
        emb_key = os.getenv("JINA_API_KEY")
        if not emb_key:
            print("✗ Set JINA_API_KEY (free at jina.ai)")
            sys.exit(1)
        embed_fn = lambda t: get_embedding_jina(t, emb_key)
    elif args.provider == "openai":
        emb_key = os.getenv("OPENAI_API_KEY")
        if not emb_key:
            print("✗ Set OPENAI_API_KEY")
            sys.exit(1)
        embed_fn = lambda t: get_embedding_openai(t, emb_key)
    else:
        embed_fn = get_embedding_local

    # Load chunks
    with open(args.chunks_file, "r", encoding="utf-8") as f:
        chunks = json.load(f)
    print(f"✓ Loaded {len(chunks)} chunks from {args.chunks_file}")

    # Clear existing
    if args.clear:
        print("  Clearing existing chunks...")
        sb.table("hr_knowledge_chunks").delete().neq(
            "id", "00000000-0000-0000-0000-000000000000"
        ).execute()

    # Ingest
    success = 0
    for i, chunk in enumerate(chunks, 1):
        try:
            print(f"[{i}/{len(chunks)}] {chunk['source_title']} · {chunk.get('section', '-')}")
            embedding = embed_fn(chunk["chunk_text"])

            sb.table("hr_knowledge_chunks").insert({
                "source_title": chunk["source_title"],
                "source_kind": chunk["source_kind"],
                "chunk_text": chunk["chunk_text"],
                "embedding": embedding,
                "metadata": {
                    "regulation_no": chunk.get("regulation_no"),
                    "section": chunk.get("section"),
                    "provider": args.provider,
                },
            }).execute()
            success += 1
            time.sleep(0.2)  # rate-limit friendly
        except Exception as e:
            print(f"  ✗ Failed: {e}")

    print(f"\n✓ Ingested {success}/{len(chunks)} chunks successfully")
    print(f"  Provider: {args.provider}")
    print(f"  Next step: test retrieval with `python scripts/test_rag.py`")


if __name__ == "__main__":
    main()
