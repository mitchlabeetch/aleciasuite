import os
import psycopg2
from openai import OpenAI
from typing import Dict, Any, List, Optional
from pgvector.psycopg2 import register_vector

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

def get_conn():
    conn = psycopg2.connect(DATABASE_URL)
    register_vector(conn)
    return conn

def ensure_table():
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
    cursor.execute("CREATE SCHEMA IF NOT EXISTS alecia_bi")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS alecia_bi.document_embeddings (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            embedding vector(1536),
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx
        ON alecia_bi.document_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)

    conn.commit()
    cursor.close()
    conn.close()

def get_embedding(text: str) -> List[float]:
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def index_document(doc_id: str, content: str, metadata: Dict[str, Any]):
    embedding = get_embedding(content)
    conn = get_conn()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO alecia_bi.document_embeddings (id, content, embedding, metadata)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE
        SET content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            created_at = NOW()
    """, (doc_id, content, embedding, psycopg2.extras.Json(metadata)))

    conn.commit()
    cursor.close()
    conn.close()

def search_documents(query: str, top_k: int = 10, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    query_embedding = get_embedding(query)
    conn = get_conn()
    cursor = conn.cursor()

    sql = """
        SELECT id, content, metadata, 1 - (embedding <=> %s) AS similarity
        FROM alecia_bi.document_embeddings
    """
    params = [query_embedding]

    if filters:
        filter_clauses = []
        for key, value in filters.items():
            filter_clauses.append(f"metadata->>%s = %s")
            params.extend([key, str(value)])
        sql += " WHERE " + " AND ".join(filter_clauses)

    sql += " ORDER BY embedding <=> %s LIMIT %s"
    params.extend([query_embedding, top_k])

    cursor.execute(sql, params)
    rows = cursor.fetchall()

    results = []
    for row in rows:
        results.append({
            "id": row[0],
            "content": row[1],
            "metadata": row[2],
            "similarity": float(row[3])
        })

    cursor.close()
    conn.close()
    return results

def delete_document(doc_id: str):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alecia_bi.document_embeddings WHERE id = %s", (doc_id,))
    conn.commit()
    cursor.close()
    conn.close()
