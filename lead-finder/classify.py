"""Heuristic scoring: is this post/article a Wisconsin CRE buy/sell/lease signal?"""

from config import (
    WI_PLACES, BUY_KEYWORDS, LEASE_KEYWORDS, SELL_KEYWORDS, LEASE_OUT_KEYWORDS,
    PROPERTY_TYPE_KEYWORDS, SCORE_THRESHOLD,
)

# Supply-side (owner wants to sell or fill their space) is checked first and,
# when present, takes priority over demand-side — a post from an owner
# actively trying to dispose of or fill a property is the rarer, more
# valuable find, and the two are rarely both genuinely true of one post.
SUPPLY_GROUPS = {"Sell": SELL_KEYWORDS, "List for Lease": LEASE_OUT_KEYWORDS}
DEMAND_GROUPS = {"Buy": BUY_KEYWORDS, "Lease": LEASE_KEYWORDS}


def _match_groups(groups, text):
    matched = {}
    for label, keywords in groups.items():
        hits = [k for k in keywords if k in text]
        if hits:
            matched[label] = hits
    return matched


def classify(title, snippet, assumed_location=None):
    text = f"{title or ''} {snippet or ''}".lower()

    location_text = assumed_location
    if not location_text:
        for place in WI_PLACES:
            if place in text:
                location_text = place.strip(" ,").title()
                break

    supply_matches = _match_groups(SUPPLY_GROUPS, text)
    demand_matches = _match_groups(DEMAND_GROUPS, text)

    if supply_matches:
        signal_type = "/".join(supply_matches.keys())
        matched_signal_kw = [kw for hits in supply_matches.values() for kw in hits]
    elif demand_matches:
        signal_type = "/".join(demand_matches.keys())
        matched_signal_kw = [kw for hits in demand_matches.values() for kw in hits]
    else:
        signal_type = "Unclear"
        matched_signal_kw = []

    property_type_guess = None
    matched_property_kw = []
    for ptype, kws in PROPERTY_TYPE_KEYWORDS.items():
        hits = [k for k in kws if k in text]
        if hits:
            property_type_guess = ptype
            matched_property_kw = hits
            break

    score = 0
    if signal_type != "Unclear":
        score += 40
    if location_text:
        score += 30
    if property_type_guess:
        score += 15
    score += min(len(matched_signal_kw), 3) * 5

    matched_keywords = matched_signal_kw + matched_property_kw

    return {
        "relevant": score >= SCORE_THRESHOLD,
        "signal_type": signal_type,
        "location_text": location_text,
        "property_type_guess": property_type_guess,
        "confidence_score": score,
        "keywords_matched": matched_keywords,
    }
