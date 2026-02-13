from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.indexer import ensure_table, index_document, search_documents, delete_document

app = FastAPI(title="Alecia Haystack", version="1.0.0")

class IndexRequest(BaseModel):
    doc_id: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filters: Optional[Dict[str, Any]] = None

@app.on_event("startup")
async def startup():
    ensure_table()

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "alecia-haystack"}

@app.post("/index")
async def index(req: IndexRequest):
    try:
        index_document(req.doc_id, req.content, req.metadata or {})
        return {"success": True, "doc_id": req.doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def search(req: SearchRequest):
    try:
        results = search_documents(req.query, req.top_k, req.filters)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
async def delete(doc_id: str):
    try:
        delete_document(doc_id)
        return {"success": True, "doc_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
