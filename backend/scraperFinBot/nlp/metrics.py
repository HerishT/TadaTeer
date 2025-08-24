# metrics.py
import re
from typing import List, Dict, Any

NE_DIGIT = str.maketrans("०१२३४५६७८९", "0123456789")
NE_UNITS = {"लाख": 100_000, "करोड": 10_000_000, "अर्ब": 1_000_000_000}
EN_UNITS = {"crore": 10_000_000, "cr": 10_000_000, "million": 1_000_000,
            "mn": 1_000_000, "billion": 1_000_000_000, "bn": 1_000_000_000}

CURRENCY_TOKENS = [r"NPR", r"NRs\.?", r"Rs\.?", r"रु\.?", r"रुपैयाँ"]

EN_ANCHORS = {
    "net_profit": [r"net\s+profit", r"profit\s+after\s+tax", r"\bPAT\b", r"profit\s+for\s+the\s+period", r"profit\s+for\s+the\s+quarter"],
    "revenue":    [r"\brevenue\b", r"total\s+income", r"operating\s+income", r"interest\s+income", r"fee\s+and\s+commission\s+income"],
    "expenses":   [r"\bexpenses?\b", r"operating\s+expenses?", r"interest\s+expenses?"],
    "debt":       [r"\bborrowings?\b", r"\bdebt\b", r"loans?\s+and\s+advances"],
}
NE_ANCHORS = {
    "net_profit": [r"खुद\s*(?:नाफा|मुनाफा|लाभ)", r"अवधिको\s*लाभ", r"त्रैमासिक\s*नाफा"],
    "revenue":    [r"राजस्व", r"आम्दानी", r"कुल\s*आम्दानी"],
    "expenses":   [r"खर्च", r"व्यय"],
    "debt":       [r"ऋण", r"कर्जा"],
}

DOC_HEADERS = [
    r"statement\s+of\s+profit\s+and\s+loss", r"statement\s+of\s+profit\s+or\s+loss",
    r"statement\s+of\s+comprehensive\s+income", r"profit\s+and\s+loss\s+account",
    r"आय\s*विवरण", r"नाफा\s*नोक्सानी", r"समग्र\s*आम्दानी",
]

def _norm(s: str) -> str:
    s = (s or "").replace("’", "'").translate(NE_DIGIT)
    return re.sub(r"[ \t]+", " ", s)

def _detect_scale(text: str) -> float:
    t = _norm(text).lower()
    # look for “in '000”, “in 000s”
    if re.search(r"in\s*['’]?\s*0{3}s?\b", t):
        return 1_000.0
    # “in million(s)”
    if re.search(r"in\s*million[s]?\b", t):
        return 1_000_000.0
    # “in crore(s)”
    if re.search(r"in\s*crore[s]?\b", t):
        return 10_000_000.0
    # Nepali ’000s: “हजारमा”, “हजारमा रहेको”
    if re.search(r"हजारमा", t):
        return 1_000.0
    return 1.0

_AMOUNT_RE = re.compile(
    r"(?:(?:{}))?\s*([\(\-]?\d[\d,]*(?:\.\d+)?)\s*(%|crore|cr|million|mn|billion|bn|लाख|करोड|अर्ब)?".format("|".join(CURRENCY_TOKENS)),
    re.I
)

def _parse_amount(span: str, doc_scale: float = 1.0) -> float | None:
    s = _norm(span)
    m = _AMOUNT_RE.search(s)
    if not m:
        return None
    raw = m.group(1)
    unit = (m.group(2) or "").lower()

    neg = (raw or "").startswith("-") or ("(" in raw and ")" in raw)
    try:
        val = float(raw.replace(",", "").replace("(", "").replace(")", ""))
    except Exception:
        return None

    if unit in EN_UNITS:
        val *= EN_UNITS[unit]
    elif unit in NE_UNITS:
        val *= NE_UNITS[unit]

    val *= doc_scale
    return -abs(val) if neg else val

def _collect(text: str, anchors: List[str], radius: int, scale: float) -> List[float]:
    t = _norm(text)
    out: List[float] = []
    for a in anchors:
        for m in re.finditer(a, t, re.I):
            s, e = max(0, m.start() - radius), min(len(t), m.end() + radius)
            win = t[s:e]
            # parse first plausible amount near the anchor
            for m2 in _AMOUNT_RE.finditer(win):
                v = _parse_amount(m2.group(0), scale)
                if v is not None:
                    out.append(v)
                    break
    return out

def _collect_growth(text: str) -> List[float]:
    t = _norm(text); out: List[float] = []
    for m in re.finditer(r"(growth|increase|decrease|YoY|QoQ|वृद्धि|कमी|वृद्धि\s*दर)", t, re.I):
        s, e = max(0, m.start()-40), min(len(t), m.end()+40)
        win = t[s:e]
        for m2 in re.finditer(r"[-+]?\d[\d,]*(?:\.\d+)?\s*%", win):
            try:
                out.append(float(m2.group(0).replace("%","").replace(",",""))); break
            except Exception:
                pass
    return out

def extract_metrics(chunks: List[Dict[str, Any]]) -> Dict[str, List[float]]:
    metrics = {k: [] for k in ["revenue","net_profit","expenses","debt","growth_pct"]}
    if not chunks: return metrics
    for ch in chunks:
        t = ch.get("text") or ""
        if not t.strip(): continue
        scale = _detect_scale(t)
        radius = 140 if any(re.search(h, t, re.I) for h in DOC_HEADERS) else 90
        for k, pats in EN_ANCHORS.items(): metrics[k].extend(_collect(t, pats, radius, scale))
        for k, pats in NE_ANCHORS.items(): metrics[k].extend(_collect(t, pats, radius, scale))
        metrics["growth_pct"].extend(_collect_growth(t))

    # dedupe + sort by magnitude
    for k, vals in metrics.items():
        seen=set(); uniq=[]
        for v in vals:
            sig=round(v,2)
            if sig not in seen: seen.add(sig); uniq.append(v)
        metrics[k]=sorted(uniq, key=lambda x: abs(x), reverse=True)[:5]
    return metrics
