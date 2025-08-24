# connectors/nepse_adapter.py
from typing import Optional, Dict, Any, List
import json

try:
    # pip install nepse-scraper
    from nepse_scraper import Nepse_scraper
    _HAVE = True
except Exception:
    Nepse_scraper = None  # type: ignore
    _HAVE = False


def _normalize_rows(rows: Any) -> List[Dict[str, Any]]:
    """
    Convert whatever nepse_scraper returns into List[Dict[str, Any]].
    Handles:
      - pandas.DataFrame (via .to_dict(orient="records"))
      - dict with common containers (data/items/rows/results)
      - JSON string
      - already a list of dicts
    Returns [] on failure.
    """
    if rows is None:
        return []

    # pandas.DataFrame?
    to_dict = getattr(rows, "to_dict", None)
    if callable(to_dict):
        try:
            return rows.to_dict(orient="records")  # type: ignore
        except Exception:
            pass

    # dict with nested list
    if isinstance(rows, dict):
        for key in ("data", "items", "rows", "results"):
            val = rows.get(key)
            if isinstance(val, list):
                return [x for x in val if isinstance(x, dict)]
        # sometimes it's already a single row dict
        return [rows] if rows else []

    # JSON string?
    if isinstance(rows, str):
        try:
            return _normalize_rows(json.loads(rows))
        except Exception:
            return []

    # list of dicts
    if isinstance(rows, list):
        return [x for x in rows if isinstance(x, dict)]

    return []


class NepseAdapter:
    """
    Thin wrapper around nepse_scraper.Nepse_scraper with normalized outputs.

    get_today() -> List[Dict] with fields typically including:
      - companyName, symbol, sectorName, ltp, percentageChange,
        totalTradedQuantity, openPrice, high, low, ...

    resolve_company(name_like) -> Dict with keys: name, symbol, sector
    market_snapshot(symbol)    -> Dict with ltp/percent_change/volume/open/high/low
    """
    def __init__(self):
        if not _HAVE:
            raise RuntimeError("nepse-scraper not installed. `pip install nepse-scraper`")
        self._cli = Nepse_scraper()

    def get_today(self) -> List[Dict[str, Any]]:
        try:
            raw = self._cli.get_today_price()
        except Exception:
            return []
        return _normalize_rows(raw)

    def resolve_company(self, name_like: str) -> Optional[Dict[str, Any]]:
        rows = self.get_today()
        if not rows:
            return None

        q = (name_like or "").strip().lower()
        if not q:
            return None

        # pass 1: exact/substring match on symbol or companyName
        for r in rows:
            cname = str(r.get("companyName", "")).strip()
            sym   = str(r.get("symbol", "")).strip()
            if not cname and not sym:
                continue
            if q == sym.lower() or q in cname.lower() or cname.lower() in q:
                return {
                    "name": cname or name_like,
                    "symbol": sym or None,
                    "sector": r.get("sectorName"),
                }

        # pass 2: token overlap on companyName
        q_tokens = [t for t in q.split() if t]
        for r in rows:
            cname = str(r.get("companyName", "")).lower()
            if cname and any(t in cname for t in q_tokens):
                return {
                    "name": r.get("companyName") or name_like,
                    "symbol": r.get("symbol"),
                    "sector": r.get("sectorName"),
                }

        return None

    def market_snapshot(self, symbol: str) -> Optional[Dict[str, Any]]:
        rows = self.get_today()
        if not rows or not symbol:
            return None
        sym_u = symbol.upper()
        for r in rows:
            if str(r.get("symbol", "")).upper() == sym_u:
                return {
                    "ltp": r.get("ltp"),
                    "percent_change": r.get("percentageChange"),
                    "volume": r.get("totalTradedQuantity"),
                    "open": r.get("openPrice"),
                    "high": r.get("high"),
                    "low": r.get("low"),
                }
        return None
