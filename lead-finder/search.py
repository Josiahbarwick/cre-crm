#!/usr/bin/env python3
"""Entry point: find Wisconsin CRE buy/lease signals and log them to the CRM.

Usage:
    python3 search.py

Reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from the environment, or from
a .env file next to this script (see .env.example).
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def load_dotenv():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


load_dotenv()

from classify import classify  # noqa: E402
from enrich import guess_business_name, lookup_contact_info  # noqa: E402
from sources import fetch_reddit, fetch_google_news  # noqa: E402
from supabase_upsert import upsert_leads  # noqa: E402


def main():
    print("Fetching Reddit…")
    reddit_items = fetch_reddit()
    print(f"  {len(reddit_items)} raw Reddit posts")

    print("Fetching Google News…")
    news_items = fetch_google_news()
    print(f"  {len(news_items)} raw news articles")

    raw_items = reddit_items + news_items
    rows = []
    for item in raw_items:
        result = classify(item["title"], item["snippet"], item.get("assumed_location"))
        if not result["relevant"]:
            continue
        rows.append({
            "source": item["source"],
            "source_url": item["source_url"],
            "title": item["title"],
            "snippet": item["snippet"],
            "author": item.get("author"),
            "posted_at": item.get("posted_at"),
            "location_text": result["location_text"],
            "signal_type": result["signal_type"],
            "property_type_guess": result["property_type_guess"],
            "keywords_matched": result["keywords_matched"],
            "confidence_score": result["confidence_score"],
            "status": "New",
            # Always present (even as null) — PostgREST's bulk insert
            # requires every row in a batch to have identical keys.
            "contact_phone": None,
            "contact_website": None,
        })

    print(f"{len(rows)} of {len(raw_items)} items scored as relevant leads.")

    print("Looking up public contact info where a business name can be guessed…")
    enriched = 0
    for row in rows:
        name = guess_business_name(row["title"])
        if not name:
            continue
        contact = lookup_contact_info(name, row["location_text"])
        if not contact:
            continue
        row["contact_phone"] = contact.get("phone")
        row["contact_website"] = contact.get("website")
        enriched += 1
    print(f"  found contact info for {enriched} of {len(rows)} leads (best-effort — "
          f"OpenStreetMap coverage for small WI businesses is spotty, this is a bonus not a guarantee).")

    inserted = upsert_leads(rows)
    print(f"Upserted {inserted} rows to Supabase (existing URLs were skipped).")


if __name__ == "__main__":
    main()
