# retriever.py
from typing import List, Dict, Any
from vectorstore.indexer import get_collection, embed_texts

def retrieve_chunks(company: str, question: str, top_k: int = 12) -> List[Dict[str, Any]]:
    try:
        col = get_collection(company)
    except Exception:
        return []

    try:
        if hasattr(col, "count") and col.count() == 0:
            return []
    except Exception:
        pass

    try:
        q_emb = embed_texts([question])[0]
    except Exception:
        return []

    try:
        res = col.query(
            query_embeddings=[q_emb],
            n_results=max(1, int(top_k)),
            include=["documents", "metadatas", "distances"],  # valid keys
        )
    except Exception:
        return []

    chunks: List[Dict[str, Any]] = []
    md_lists  = res.get("metadatas")  or []
    doc_lists = res.get("documents")  or []
    dst_lists = res.get("distances")  or []

    for i in range(len(doc_lists)):
        docs = doc_lists[i] or []
        mds  = md_lists[i]  or [None] * len(docs)
        dists = dst_lists[i] if i < len(dst_lists) and dst_lists[i] is not None else [None] * len(docs)
        for text, md, dist in zip(docs, mds, dists):
            md = md or {}
            chunks.append({
                "url": md.get("url"),
                "type": md.get("type"),
                "text": text,
                "distance": dist,
            })

    return chunks
