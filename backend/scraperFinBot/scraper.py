# scraper.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any
from services.orchestrator import answer_question, reindex_company

app = FastAPI(title="TadaTeer Backend", version="0.4.0")

class QARequest(BaseModel):
    question: str

@app.post("/qa")
async def qa(req: QARequest) -> Dict[str, Any]:
    try:
        return await answer_question(req.question)
    except Exception as e:
        return {"error": "internal_error", "path": "/qa", "detail": f"{type(e).__name__}: {e}"}

@app.post("/reindex")
async def reindex(req: QARequest) -> Dict[str, Any]:
    try:
        return await reindex_company(req.question)
    except Exception as e:
        return {"error": "internal_error", "path": "/reindex", "detail": f"{type(e).__name__}: {e}"}
