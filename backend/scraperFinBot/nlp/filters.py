# filters.py
import os, re
from typing import List, Dict, Tuple

MIN_TEXT_LEN = int(os.getenv("TADATEER_FILTER_MIN_TEXT", "200"))
MIN_POSITIVE = int(os.getenv("TADATEER_FILTER_MIN_POS",  "2"))

# Positive financial cues (EN + NP)
EN_POS = [
    r"\bunaudited\b", r"\bfinancial statements?\b",
    r"\bstatement of (?:profit|income)\b", r"\bprofit (?:and )?loss\b",
    r"\bnet\s+profit\b", r"\bPAT\b", r"\brevenue\b", r"\bexpenses?\b",
    r"\bquarter(?:ly)?\b", r"\bQ[1-4]\b", r"\bEPS\b", r"\bNPR\b", r"\bRs\.?\b",
]
NE_POS = [
    r"त्रैमासिक", r"आर्थिक\s*विवरण", r"वित्तीय\s*विवरण",
    r"आय\s*विवरण", r"नाफा\s*नोक्सानी", r"समग्र\s*आम्दानी",
    r"खुद\s*(?:नाफा|मुनाफा|लाभ)", r"राजस्व", r"आम्दानी", r"खर्च",
]

# URLs we like
URL_POS = [
    "financial-statement", "financial-statements", "financials",
    "financial-reports", "results", "result", "quarter", "/q1", "/q2", "/q3", "/q4",
    "unaudited", "disclosure", "statement-of-profit", "profit-and-loss",
    "nabilbank",
]

# URLs to drop (MF, forms, brochures, generic news)
URL_NEG = [
    "mutual-fund", "monthly-nav", "dp-forms", "demat", "ipo-", "/ipo",
    "brochure", "prospectus", "news-and-events", "/downloads", "/forms",
    "corporate-advisory", "innovative-financial-solutions",
    "merolagani.com/ipo", "merolagani.com/fund", "mf-", "nav",
]

POS_PATTERNS = [re.compile(p, re.I) for p in EN_POS] + [re.compile(p) for p in NE_POS]

def _score(doc: Dict) -> Tuple[int, int, int]:
    text = (doc.get("text") or "")
    url  = (doc.get("url")  or "").lower()
    typ  = doc.get("type")
    pos = sum(1 for pat in POS_PATTERNS if pat.search(text))
    url_bonus = sum(1 for k in URL_POS if k in url)
    pdf_bonus = 2 if typ == "pdf" else 0
    return (pos, url_bonus, pdf_bonus)

def filter_financial_docs(docs: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
    keep, drop = [], []
    for d in docs:
        text = (d.get("text") or "")
        url  = (d.get("url") or "").lower()
        typ  = d.get("type")

        # hard drop by URL blacklist
        if any(k in url for k in URL_NEG):
            drop.append(d); continue

        # let financial-looking PDFs pass even if text short (scans)
        if typ == "pdf" and any(k in url for k in URL_POS):
            keep.append(d); continue

        # otherwise enforce minimal text
        if len(text) < MIN_TEXT_LEN:
            drop.append(d); continue

        pos, url_bonus, pdf_bonus = _score(d)
        if (pos + url_bonus + pdf_bonus) >= MIN_POSITIVE:
            keep.append(d)
        else:
            drop.append(d)
    return keep, drop
