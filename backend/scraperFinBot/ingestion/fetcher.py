# fetcher.py
import os, asyncio, re
from typing import List, Dict, Any, Tuple
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin, urlsplit, urlunsplit

USER_AGENT = os.getenv("TADATEER_UA", "TadaTeerBot/1.0 (+contact@example.com)")
UA = {"User-Agent": USER_AGENT}

MAX_HTML = int(os.getenv("TADATEER_MAX_HTML", "20"))
MAX_PDF  = int(os.getenv("TADATEER_MAX_PDF",  "12"))
RETRIES  = int(os.getenv("TADATEER_RETRIES",  "1"))

CONNECT_TO = float(os.getenv("TADATEER_CONNECT_TIMEOUT", "5"))
READ_TO    = float(os.getenv("TADATEER_READ_TIMEOUT", "10"))
WRITE_TO   = float(os.getenv("TADATEER_WRITE_TIMEOUT", "10"))
POOL_TO    = float(os.getenv("TADATEER_POOL_TIMEOUT", "5"))
HTTPX_TIMEOUT = httpx.Timeout(connect=CONNECT_TO, read=READ_TO, write=WRITE_TO, pool=POOL_TO)

# Cross-domain HTML discovery is allowed only for these (PDFs allowed from any host)
TRUSTED = {d.strip().lower() for d in os.getenv(
    "TADATEER_TRUSTED_DOMAINS",
    "www.nepalstock.com.np,nepalstock.com.np,merolagani.com,drive.google.com,docs.google.com,siteadmin.nabilbank.com,nabilinvest.com.np"
).split(",") if d.strip()}

HINTS: Tuple[str, ...] = (
    ".pdf","report","financial","results","result","quarter","q1","q2","q3","q4",
    "unaudited","disclosure","notice","press","news","investor","presentation","earnings","call","shareholder",
)
FILEISH: Tuple[str, ...] = ("download","attachment","file","document","doc","view")

PDF_HREF_RE = re.compile(r"""https?://[^\s"'<>]+\.pdf\b""", re.I)

def _norm(u: str) -> str:
    sp = urlsplit(u)
    path = sp.path or "/"
    if path != "/" and path.endswith("/"):
        path = path[:-1]
    return urlunsplit((sp.scheme or "https", sp.netloc, path, sp.query, ""))

def _same_org_or_trusted(seed_host: str, target_host: str) -> bool:
    seed_host = seed_host.lower(); target_host = target_host.lower()
    if target_host == seed_host or target_host.endswith("." + seed_host):
        return True
    return target_host in TRUSTED

def _scan_for_pdf_links(html: str, base_url: str) -> List[str]:
    out: List[str] = []
    if not html:
        return out
    # 1) anchors (.pdf)
    try:
        soup = BeautifulSoup(html, "html.parser")
        for a in soup.select("a[href]"):
            href = (a.get("href") or "").strip()
            if href.lower().endswith(".pdf"):
                if not href.startswith("http"):
                    href = urljoin(base_url, href)
                out.append(_norm(href))
    except Exception:
        pass
    # 2) absolute .pdf in inline text/scripts
    out += PDF_HREF_RE.findall(html)
    # de-dupe
    seen, uniq = set(), []
    for u in out:
        if u not in seen:
            seen.add(u); uniq.append(_norm(u))
    return uniq

async def _get(client: httpx.AsyncClient, url: str) -> httpx.Response:
    last = None
    for i in range(RETRIES + 1):
        try:
            r = await client.get(url, headers=UA, timeout=HTTPX_TIMEOUT, follow_redirects=True)
            r.raise_for_status()
            return r
        except Exception as e:
            last = e
            await asyncio.sleep(min(0.5 * (2 ** i), 2.0))
    raise last if last else httpx.HTTPError("unknown")

async def _fetch_one(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    try:
        r = await _get(client, url)
        ct = (r.headers.get("content-type", "").split(";")[0] or "").lower()
        return {"url": url, "ok": True, "ct": ct, "bytes": r.content}
    except Exception as e:
        return {"url": url, "ok": False, "err": str(e)}

def _extract_links(html: str, base_url: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    host = urlparse(base_url).netloc
    out = []
    for a in soup.select("a[href]"):
        raw = (a.get("href") or "").strip()
        if not raw:
            continue
        href = raw if raw.startswith("http") else urljoin(f"https://{host}", raw)
        out.append(_norm(href))
    return out

async def _discover_from_page(client: httpx.AsyncClient, page_url: str) -> Dict[str, List[str]]:
    try:
        r = await _get(client, page_url)
    except Exception:
        return {"html": [], "fileish": []}
    seed_host = urlparse(page_url).netloc
    links = _extract_links(r.text, page_url)

    html_candidates, fileish_candidates = [], []
    for href in links:
        target_host = urlparse(href).netloc
        lower = href.lower()
        is_pdf_ext = lower.endswith(".pdf")
        looks_fileish = any(k in lower for k in FILEISH)
        hinted = any(h in lower for h in HINTS)

        if is_pdf_ext or looks_fileish:
            fileish_candidates.append(href)
        else:
            if _same_org_or_trusted(seed_host, target_host) and hinted:
                html_candidates.append(href)

    # de-dupe
    seen, html_out, file_out = set(), [], []
    for u in html_candidates:
        if u not in seen:
            seen.add(u); html_out.append(u)
    for u in fileish_candidates:
        if u not in seen:
            seen.add(u); file_out.append(u)

    return {"html": html_out, "fileish": file_out}

async def scrape_targets(
    seeds: List[str],
    max_html: int = MAX_HTML,
    include_pdfs: bool = True,
    max_pdf: int = MAX_PDF,
) -> List[Dict[str, Any]]:
    seeds = [_norm(s) for s in seeds]
    async with httpx.AsyncClient() as client:
        # 1) fetch seeds
        seed_results = await asyncio.gather(*[_fetch_one(client, s) for s in seeds])
        ok_seed = [r for r in seed_results if r.get("ok")]

        # 2) discover from seeds
        first_wave = await asyncio.gather(*[_discover_from_page(client, r["url"]) for r in ok_seed])
        html_pool, fileish_pool = [], []
        for d in first_wave:
            html_pool.extend(d["html"])
            fileish_pool.extend(d["fileish"])

        # 3) de-dupe pools
        seen = {r["url"] for r in ok_seed}
        html_candidates, file_candidates = [], []
        for u in html_pool:
            if u not in seen:
                seen.add(u); html_candidates.append(u)
        for u in fileish_pool:
            if u not in seen:
                seen.add(u); file_candidates.append(u)

        # 4) cap
        html_candidates = html_candidates[: max_html]
        file_candidates = file_candidates[: max_pdf] if include_pdfs else []

        # 5) fetch discovered
        fetched = await asyncio.gather(*[_fetch_one(client, u) for u in (html_candidates + file_candidates)])
        all_ok = ok_seed + [r for r in fetched if r.get("ok")]

        # 6) scan fetched HTML to find additional explicit PDF links
        pdf_links: List[str] = []
        for r in all_ok:
            ct = (r.get("ct") or "").lower()
            if "html" in ct:
                try:
                    page_html = r["bytes"].decode("utf-8", errors="ignore")
                except Exception:
                    page_html = ""
                pdf_links.extend(_scan_for_pdf_links(page_html, r["url"]))

        # fetch extra PDFs discovered in HTML (respect max_pdf slots)
        if include_pdfs and pdf_links:
            seen_urls = {x["url"] for x in all_ok}
            pdf_links = [u for u in pdf_links if u not in seen_urls]
            existing_pdf = sum(1 for x in all_ok if "pdf" in (x.get("ct","").lower()) or x["url"].lower().endswith(".pdf"))
            slots = max(0, max_pdf - existing_pdf)
            pdf_links = pdf_links[:slots]
            if pdf_links:
                more_pdf = await asyncio.gather(*[_fetch_one(client, u) for u in pdf_links])
                all_ok += [x for x in more_pdf if x.get("ok")]

        return all_ok
