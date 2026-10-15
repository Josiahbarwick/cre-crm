"""Heuristic scoring: is this post/article a Wisconsin CRE buy/lease signal?"""

from config import WI_PLACES, BUY_KEYWORDS, LEASE_KEYWORDS, PROPERTY_TYPE_KEYWORDS, SCORE_THRESHOLD


def classify(title, snippet, assumed_location=None):
    text = f"{title or ''} {snippet or ''}".lower()

    location_text = assumed_location
    if not location_text:
        for place in WI_PLACES:
            if place in text:
                location_text = place.strip(" ,").title()
                break

    matched_buy = [k for k in BUY_KEYWORDS if k in text]
    matched_lease = [k for k in LEASE_KEYWORDS if k in text]

    if matched_buy and matched_lease:
        signal_type = "Buy/Lease"
    elif matched_buy:
        signal_type = "Buy"
    elif matched_lease:
        signal_type = "Lease"
    else:
        signal_type = "Unclear"

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
    score += min(len(matched_buy) + len(matched_lease), 3) * 5

    matched_keywords = matched_buy + matched_lease + matched_property_kw

    return {
        "relevant": score >= SCORE_THRESHOLD,
        "signal_type": signal_type,
        "location_text": location_text,
        "property_type_guess": property_type_guess,
        "confidence_score": score,
        "keywords_matched": matched_keywords,
    }
