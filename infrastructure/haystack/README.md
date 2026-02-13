# Alecia Haystack - Semantic Document Search

FastAPI microservice providing semantic search for M&A documents using pgvector and OpenAI embeddings.

## Architecture

- **Storage**: PostgreSQL with pgvector extension
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Search**: Cosine similarity with IVFFlat index
- **API**: FastAPI with 4 endpoints

## Endpoints

### GET /health
Health check endpoint.

### POST /index
Index a document with embeddings.
```json
{
  "doc_id": "deal-123-cim",
  "content": "Confidential Information Memorandum...",
  "metadata": {
    "deal_id": "deal-123",
    "type": "cim",
    "date": "2026-02-09"
  }
}
```

### POST /search
Semantic search with optional metadata filters.
```json
{
  "query": "EBITDA multiple analysis",
  "top_k": 10,
  "filters": {
    "deal_id": "deal-123",
    "type": "cim"
  }
}
```

Returns:
```json
{
  "results": [
    {
      "id": "deal-123-cim",
      "content": "...",
      "metadata": {...},
      "similarity": 0.87
    }
  ]
}
```

### DELETE /documents/{doc_id}
Delete a document from the index.

## Database Schema

```sql
CREATE TABLE alecia_bi.document_embeddings (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX document_embeddings_embedding_idx
ON alecia_bi.document_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Development

```bash
cd infrastructure
docker compose -f docker-compose.dev.yml up haystack
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings

## Usage Example

```bash
curl -X POST http://localhost:8090/index \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "deal-456-dd",
    "content": "Due diligence report...",
    "metadata": {"deal_id": "deal-456", "type": "dd"}
  }'

curl -X POST http://localhost:8090/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "financial risks",
    "top_k": 5,
    "filters": {"deal_id": "deal-456"}
  }'
```

## Integration with Alecia BI

The service stores embeddings in `alecia_bi.document_embeddings` table, accessible to all Alecia Suite components. Use for:

- Deal document semantic search
- Due diligence Q&A
- CIM content retrieval
- Research note discovery
