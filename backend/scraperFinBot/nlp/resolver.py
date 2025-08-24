# resolver.py
from typing import List, Dict, Optional

# Optional NEPSE integration
try:
    from connectors.nepse_adapter import NepseAdapter
    _NEPSE = NepseAdapter()
except Exception:
    _NEPSE = None  # works even if nepse-scraper isn't installed


# ---- known investor-relations seeds ----
KNOWN_IR: Dict[str, Dict[str, List[str] | str]] = {
    "nabil bank": {
        "base": "https://www.nabilbank.com",
        "paths": [
            "/investor-relations",
            "/investor-relations/financial-reports",
            "/investor-relations/financials",
            "/investor-relations/disclosure",
            "/media/press-release",
            "/financial-reports",
            "/financials",
            # Absolute seeds on a trusted domain (Nabil Invest):
            "https://nabilinvest.com.np/reports/company-reports/",
            # Optional bootstrap PDF to guarantee at least 1 PDF early on:
            "https://nabilinvest.com.np/wp-content/uploads/2022/07/financials-fy-2076-77.pdf",
        ],
    },
    "nabil invest": {
        "base": "https://nabilinvest.com.np",
        "paths": ["/reports/company-reports/"],
    },
}


def _build_seeds_by_key(key: str) -> List[str]:
    """Build seeds for a canonical key in KNOWN_IR."""
    key = key.strip().lower()
    out: List[str] = []
    if key in KNOWN_IR:
        base = str(KNOWN_IR[key]["base"])
        for p in list(KNOWN_IR[key]["paths"]):  # type: ignore
            p = str(p)
            if p.startswith(("http://", "https://")):
                out.append(p)             # keep absolute
            else:
                out.append(f"{base}{p}")  # join relative
    return out


def _guess_known_key(name_like: str) -> Optional[str]:
    """Return the KNOWN_IR key if the name looks like one we know."""
    q = (name_like or "").lower()
    if "nabil invest" in q:
        return "nabil invest"
    if "nabil" in q:
        return "nabil bank"
    return None


def resolve_company(query: str) -> Dict:
    """
    Resolve company info from a free-form question.
    - Use NEPSE (if available) to normalize name/ticker/sector.
    - Prefer our KNOWN_IR seeds when the name matches (so crawling works).
    - Fall back to Nabil Bank so you can test end-to-end.
    """
    q = (query or "").strip()

    # 1) Try NEPSE to normalize
    name_guess = q
    nepse_name: Optional[str] = None
    nepse_symbol: Optional[str] = None
    nepse_sector: Optional[str] = None

    if _NEPSE is not None:
        try:
            # Extract a coarse name guess from the question (very simple heuristic).
            # You can replace this with your existing NER if you have one.
            name_guess = q
            m = None
            # crude: keep everything after 'reindex ' or 'for ' etc.
            for kw in ("reindex", "for", "of"):
                if kw in q.lower():
                    try:
                        m = q.lower().split(kw, 1)[1].strip(" ?!.,")
                        if m:
                            name_guess = m
                            break
                    except Exception:
                        pass
            r = _NEPSE.resolve_company(name_guess)
            if r:
                nepse_name = (r.get("name") or "").strip() or None
                nepse_symbol = (r.get("symbol") or "").strip() or None
                nepse_sector = (r.get("sector") or "").strip() or None
        except Exception:
            pass

    # 2) Pick the best canonical key for seeds
    key = _guess_known_key(nepse_name or name_guess)  # prefer NEPSE name if we got one

    if key:
        seeds = _build_seeds_by_key(key)
        return {
            "name": "Nabil Invest" if key == "nabil invest" else "Nabil Bank",
            "ticker": nepse_symbol if nepse_symbol else ("NABIL" if key == "nabil bank" else None),
            "sector": nepse_sector if nepse_sector else ("banking" if key == "nabil bank" else "investment"),
            "seeds": seeds,
        }

    # 3) Fallback so the system stays testable
    return {
        "name": nepse_name or "Nabil Bank",
        "ticker": nepse_symbol or "NABIL",
        "sector": nepse_sector or "banking",
        "seeds": _build_seeds_by_key("nabil bank"),
    }
