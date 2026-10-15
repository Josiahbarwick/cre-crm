"""Best-effort contact enrichment: guess a business name from a lead's title,
then look it up on OpenStreetMap (free, no API key) for a public phone
number / website.

This is intentionally low-key about accuracy. Name extraction is a crude
regex heuristic (works best on Google News headlines, which tend to be
structured "<Business> is relocating/closing/for sale..."; Reddit posts
rarely name a business explicitly, so expect this to mostly come up empty
for those). OpenStreetMap's business-listing coverage for small Wisconsin
towns is inconsistent, so even a correctly-guessed name often won't have a
phone/website tagged. Treat any hit as a head start, not a confirmed match.
"""

import json
import re
import time
import urllib.parse
import urllib.request

from config import WI_PLACES

NOMINATIM_USER_AGENT = "cre-lead-finder/1.0 (Wisconsin commercial real estate lead research script)"
NOMINATIM_DELAY_SECONDS = 1.1  # Nominatim's usage policy caps this at 1 req/sec.

_TRIGGER_RE = re.compile(
    r"\b(relocat\w*|expand\w*|breaks? ground|is closing|closing (its|our|their) doors|"
    r"selling|sells|for sale|is moving|signs? lease|leas(es|ed|ing)|announces?)\b",
    re.IGNORECASE,
)
_LEADING_JUNK_RE = re.compile(r"^(the|a|an)\s+", re.IGNORECASE)

# Generic terms that occasionally end up as the whole "name" when nothing
# more specific precedes the trigger word — not real business names, so
# looking them up would just waste a request on noise.
_GENERIC_TERMS = {
    "liquor store", "store", "shop", "manufacturer", "company", "facility",
    "new facility", "market", "restaurant", "bar", "building", "business",
    "warehouse", "office", "retail", "wisconsin manufacturer", "property",
    "wisconsin", "owner",
}
_WI_PLACE_NAMES = {p.strip(" ,").lower() for p in WI_PLACES}


def guess_business_name(title):
    """Best-effort: the words before the first trigger verb in a headline.
    Returns None for anything too generic or that's actually just a place
    name (e.g. "Brookfield breaks ground..." is about a location, not a
    business called "Brookfield")."""
    if not title:
        return None
    match = _TRIGGER_RE.search(title)
    if not match:
        return None
    candidate = title[:match.start()].strip(" -:,—–")
    candidate = _LEADING_JUNK_RE.sub("", candidate).strip()
    words = candidate.split()
    if not candidate or not (1 <= len(words) <= 8) or len(candidate) > 70:
        return None
    lowered = candidate.lower()
    if lowered in _GENERIC_TERMS or lowered in _WI_PLACE_NAMES:
        return None
    return candidate


def lookup_contact_info(business_name, location_text):
    """Returns {"phone": ..., "website": ...} (either may be None) or None
    if nothing was found. Queries OpenStreetMap's Nominatim search API."""
    query = f"{business_name}, {location_text or 'Wisconsin'}, USA"
    url = (
        "https://nominatim.openstreetmap.org/search?"
        f"q={urllib.parse.quote(query)}&format=json&addressdetails=0&extratags=1"
        "&limit=1&countrycodes=us"
    )
    req = urllib.request.Request(url, headers={"User-Agent": NOMINATIM_USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            results = json.loads(resp.read())
    except Exception as e:
        print(f"  [enrich] lookup failed for {business_name!r}: {e}")
        return None
    finally:
        time.sleep(NOMINATIM_DELAY_SECONDS)

    if not results:
        return None
    extratags = results[0].get("extratags") or {}
    phone = extratags.get("phone") or extratags.get("contact:phone")
    website = extratags.get("website") or extratags.get("contact:website")
    if not phone and not website:
        return None
    return {"phone": phone, "website": website}
