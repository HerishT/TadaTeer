# indexer.py
import os, hashlib, re
from typing import List, Dict, Tuple
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# Embeddings
_EMB_MODEL_NAME = os.getenv("TADATEER_EMB_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
_model = SentenceTransformer(_EMB_MODEL_NAME)

# Chroma (persistent by default)
_DB_PATH = os.getenv("TADATEER_CHROMA_PATH", ".chroma")
client = chromadb.PersistentClient(path=_DB_PATH, settings=Settings(anonymized_telemetry=False))

_NAME_RE = re.compile(r"[^a-zA-Z0-9._-]+")

def sanitize_collection_name(raw: str) -> str:
    s = (raw or "default").strip().replace(" ", "_")
    s = _NAME_RE.sub("-", s).strip("._-")
    if len(s) < 3: s = (s + "-col")[:3]
    return s[:128]

def embed_texts(texts: List[str]) -> List[List[float]]:
    return _model.encode(texts, normalize_embeddings=True).tolist()

def get_collection(company: str):
    name = sanitize_collection_name(company)
    return client.get_or_create_collection(name=name)

def reset_company(company: str) -> bool:
    name = sanitize_collection_name(company)
    try:
        client.delete_collection(name)
    except Exception:
        pass
    client.get_or_create_collection(name)
    return True

def _chunk(text: str, max_words: int = 200) -> List[str]:
    words = text.split()
    out = []
    for i in range(0, len(words), max_words):
        out.append(" ".join(words[i:i+max_words]))
    return out

def index_docs(company: str, docs: List[Dict]) -> Tuple[int, int]:
    col = get_collection(company)
    to_add_ids, to_add_docs, to_add_metas = [], [], []

    for d in docs:
        url = d.get("url") or ""
        text = d.get("text") or ""
        typ  = d.get("type") or "html"
        if not text and typ != "pdf":
            continue

        chunks = _chunk(text) if text else [""]  # allow empty chunk for scanned PDF
        for idx, ch in enumerate(chunks):
            raw_id = f"{url}::{idx}::{hashlib.sha1(ch.encode('utf-8')).hexdigest()}"
            cid = hashlib.sha1(raw_id.encode("utf-8")).hexdigest()
            to_add_ids.append(cid)
            to_add_docs.append(ch)
            to_add_metas.append({"url": url, "type": typ})

    if not to_add_ids:
        return (0, col.count() if hasattr(col, "count") else 0)

    embs = embed_texts(to_add_docs)
    try:
        col.add(ids=to_add_ids, embeddings=embs, documents=to_add_docs, metadatas=to_add_metas)
    except Exception:
        # Best-effort: ignore duplicates
        pass

    total = col.count() if hasattr(col, "count") else 0
    return (len(to_add_ids), total)
