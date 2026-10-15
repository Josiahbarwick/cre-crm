"""Minimal Supabase REST client (stdlib only) for upserting into the leads table."""

import json
import os
import urllib.error
import urllib.request


def _env_or_die(name):
    val = os.environ.get(name)
    if not val:
        raise SystemExit(
            f"Missing {name}. Copy .env.example to .env and fill it in, "
            f"or export it before running."
        )
    return val


def upsert_leads(rows, batch_size=50):
    if not rows:
        return 0

    supabase_url = _env_or_die("SUPABASE_URL").rstrip("/")
    service_key = _env_or_die("SUPABASE_SERVICE_ROLE_KEY")

    endpoint = f"{supabase_url}/rest/v1/leads?on_conflict=source_url"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        # Skip rows whose source_url already exists instead of overwriting
        # a status/notes the broker already set on them. return=representation
        # (rather than minimal) so the response tells us how many rows were
        # *actually* newly inserted, vs. sent-but-already-seen.
        "Prefer": "resolution=ignore-duplicates,return=representation",
    }

    inserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        body = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read())
            inserted += len(result)
        except urllib.error.HTTPError as e:
            print(f"  [supabase] batch failed ({e.code}): {e.read().decode('utf-8', 'replace')}")
    return inserted
