"""Pulls raw candidate posts/articles from public, read-only endpoints.

Reddit is accessed via its official OAuth API when REDDIT_CLIENT_ID /
REDDIT_CLIENT_SECRET are set (recommended — see README for the free, 2-minute
app setup at reddit.com/prefs/apps). Without credentials it falls back to
Reddit's unauthenticated public search JSON at a low, polite request rate.
Google News is read via its public RSS search feed. No login, scraping of
logged-in-only pages, or circumvention of access controls is involved.
"""

import base64
import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from config import SUBREDDITS, SUBREDDIT_QUERIES, SITEWIDE_REDDIT_QUERIES, GOOGLE_NEWS_QUERIES

USER_AGENT = "cre-lead-finder/1.0 (Wisconsin commercial real estate lead research script)"
REQUEST_DELAY_SECONDS = 1.5

_reddit_token = None


def _get(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def _reddit_oauth_token():
    """Client-credentials OAuth token for read-only app-only access. Returns
    None (triggering the unauthenticated fallback) if no app is configured."""
    global _reddit_token
    if _reddit_token:
        return _reddit_token
    client_id = os.environ.get("REDDIT_CLIENT_ID")
    client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        return None
    auth = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    req = urllib.request.Request(
        "https://www.reddit.com/api/v1/access_token",
        data=b"grant_type=client_credentials",
        headers={
            "User-Agent": USER_AGENT,
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            _reddit_token = json.loads(resp.read())["access_token"]
            return _reddit_token
    except Exception as e:
        print(f"  [reddit] OAuth token request failed, falling back to public search.json ({e})")
        return None


def _strip_html(s):
    return re.sub(r"<[^>]+>", " ", s or "").strip()


def fetch_reddit():
    items = []
    seen_ids = set()
    token = _reddit_oauth_token()
    if not token:
        print(
            "  [reddit] no REDDIT_CLIENT_ID/SECRET set, and Reddit now blocks "
            "unauthenticated script requests (403) — skipping Reddit this run. "
            "See README.md to set up the free API app."
        )
        return items
    base = "https://oauth.reddit.com"
    headers = {"Authorization": f"Bearer {token}"}
    print("  [reddit] using OAuth API")

    def run_search(path_and_query, assumed_location):
        try:
            raw = _get(f"{base}{path_and_query}", headers=headers)
            data = json.loads(raw)
        except Exception as e:
            print(f"  [reddit] skip ({e}): {path_and_query}")
            return
        for child in data.get("data", {}).get("children", []):
            post = child.get("data", {})
            post_id = post.get("id")
            if not post_id or post_id in seen_ids:
                continue
            seen_ids.add(post_id)
            permalink = post.get("permalink")
            if not permalink:
                continue
            created = post.get("created_utc")
            posted_at = (
                datetime.fromtimestamp(created, tz=timezone.utc).isoformat()
                if created else None
            )
            items.append({
                "source": "Reddit",
                "source_url": f"https://www.reddit.com{permalink}",
                "title": post.get("title", "")[:500],
                "snippet": (post.get("selftext") or "")[:1000],
                "author": post.get("author"),
                "posted_at": posted_at,
                "assumed_location": assumed_location,
            })

    for sub, assumed_location in SUBREDDITS:
        for query in SUBREDDIT_QUERIES:
            path = (
                f"/r/{sub}/search.json?"
                f"q={urllib.parse.quote(query)}&restrict_sr=on&sort=new&limit=15"
            )
            run_search(path, assumed_location)
            time.sleep(REQUEST_DELAY_SECONDS)

    for query in SITEWIDE_REDDIT_QUERIES:
        path = f"/search.json?q={urllib.parse.quote(query)}&sort=new&limit=15"
        run_search(path, None)
        time.sleep(REQUEST_DELAY_SECONDS)

    return items


def fetch_google_news():
    items = []
    for query, assumed_location in GOOGLE_NEWS_QUERIES:
        url = (
            "https://news.google.com/rss/search?q="
            f"{urllib.parse.quote(query + ' when:14d')}&hl=en-US&gl=US&ceid=US:en"
        )
        try:
            raw = _get(url)
            root = ET.fromstring(raw)
        except Exception as e:
            print(f"  [google news] skip ({e}): {query}")
            time.sleep(REQUEST_DELAY_SECONDS)
            continue
        for item in root.findall("./channel/item"):
            title = (item.findtext("title") or "")[:500]
            link = item.findtext("link") or ""
            pub_date = item.findtext("pubDate")
            posted_at = None
            if pub_date:
                try:
                    posted_at = datetime.strptime(
                        pub_date, "%a, %d %b %Y %H:%M:%S %Z"
                    ).replace(tzinfo=timezone.utc).isoformat()
                except ValueError:
                    posted_at = None
            description = _strip_html(item.findtext("description") or "")[:1000]
            source_el = item.find("source")
            author = source_el.text if source_el is not None else None
            if not link:
                continue
            items.append({
                "source": "Google News",
                "source_url": link,
                "title": title,
                "snippet": description,
                "author": author,
                "posted_at": posted_at,
                # Google News RSS does loose relevance matching, not strict
                # AND of query terms, so a "Wisconsin ..." query can still
                # return nationwide noise — unlike a subreddit, the query
                # string alone isn't trustworthy proof of location. Require
                # an actual Wisconsin place name in the article text instead.
                "assumed_location": None,
            })
        time.sleep(REQUEST_DELAY_SECONDS)
    return items
