# extractor.py
import os
from io import BytesIO
from typing import List, Dict, Any
from bs4 import BeautifulSoup

# text PDFs
from pdfminer.high_level import extract_text as pdf_extract_text

# OCR (optional)
USE_OCR = os.getenv("TADATEER_OCR", "1") == "1"
OCR_PAGES = int(os.getenv("TADATEER_OCR_PAGES", "3"))  # first N pages to OCR
OCR_DPI = int(os.getenv("TADATEER_OCR_DPI", "300"))

_ocr_ready = False
if USE_OCR:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract
        _ocr_ready = True
    except Exception:
        _ocr_ready = False  # graceful fallback

def _html_to_text(raw_bytes: bytes) -> str:
    try:
        html = raw_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    for t in soup(["script", "style", "noscript"]):
        t.extract()
    return " ".join(soup.get_text(separator=" ").split())

def _pdf_to_text_pdfminer(raw_bytes: bytes) -> str:
    try:
        txt = pdf_extract_text(BytesIO(raw_bytes)) or ""
        return " ".join(txt.split())
    except Exception:
        return ""

def _pdf_to_text_ocr(raw_bytes: bytes) -> str:
    if not _ocr_ready:
        return ""
    try:
        pages = convert_from_bytes(raw_bytes, dpi=OCR_DPI, fmt="png")
        pages = pages[:OCR_PAGES] if OCR_PAGES > 0 else pages
        out = []
        for img in pages:
            # Try Nepali + English if available; fall back to eng only
            try:
                s = pytesseract.image_to_string(img, lang="nep+eng")
            except Exception:
                s = pytesseract.image_to_string(img, lang="eng")
            out.append(s)
        return " ".join(" ".join(out).split())
    except Exception:
        return ""

def _pdf_to_text(raw_bytes: bytes) -> str:
    # 1) try text extraction
    txt = _pdf_to_text_pdfminer(raw_bytes)
    if len(txt) >= 40:
        return txt
    # 2) fallback to OCR for scans
    ocr_txt = _pdf_to_text_ocr(raw_bytes)
    return ocr_txt if len(ocr_txt) > len(txt) else txt

def extract_all(downloads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    docs: List[Dict[str, Any]] = []
    for d in downloads:
        url = d.get("url") or ""
        ct  = (d.get("ct") or "").lower()
        bb  = d.get("bytes") or b""
        if not bb:
            continue
        if "pdf" in ct or url.lower().endswith(".pdf"):
            text = _pdf_to_text(bb); typ = "pdf"
        else:
            text = _html_to_text(bb); typ = "html"

        # keep even if OCR failed but it’s a PDF (we might still cite)
        if text.strip() or typ == "pdf":
            docs.append({"url": url, "text": text or "", "type": typ})
    return docs
