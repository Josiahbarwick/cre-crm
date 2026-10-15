# Lead Finder

Finds Wisconsin commercial real estate buy/lease signals — Reddit posts and
news articles about companies relocating, expanding, or seeking space — and
logs them into the CRM's **Lead Finder** tab for you to review, dismiss, or
convert into a contact with one click.

It's a plain Python 3 script (standard library only, nothing to `pip
install`), meant to run on a schedule (cron) and write straight into the
same Supabase project the CRM uses.

## What it does and doesn't do

- **Does:** search Reddit's official read-only API and Google News' public
  RSS search for Wisconsin CRE signals, score them with a keyword/location
  heuristic, and upsert the relevant ones into the `leads` table.
- **Doesn't:** scrape LinkedIn or Facebook. Both platforms' Terms of
  Service prohibit automated scraping, and doing so risks account bans and
  legal exposure — not worth it. Instead, use the **+ Add Lead** button in
  the Lead Finder tab to paste in anything you spot yourself in a LinkedIn
  post or Facebook group; it shows up right alongside the automated finds.
- The scoring is a heuristic, not magic — expect some noise (a school or
  church "breaking ground" will occasionally sneak in alongside real
  leads). Review before converting to a contact. Tune `config.py`'s
  keyword/subreddit/query lists any time based on what you're seeing.

## One-time setup

1. **Run the schema migration.** In your Supabase project's SQL editor,
   run `../schema_v11.sql` (adds the `leads` table). Reload the CRM — the
   Lead Finder tab will light up instead of showing a setup notice.

2. **Get your Supabase service role key.** In the Supabase dashboard:
   Settings → API → "service_role" secret key (not the anon key the CRM's
   `app.js` uses — this one bypasses row-level security, so the script can
   write leads without logging in as a user). Treat it like a password:
   never commit it, never put it in `app.js` or any client-side file.

3. **Create your `.env` file:**
   ```bash
   cp .env.example .env
   ```
   then fill in `SUPABASE_URL` (already prefilled) and
   `SUPABASE_SERVICE_ROLE_KEY`.

4. **(Recommended) Set up free Reddit API credentials.** Reddit now blocks
   unauthenticated script requests, so without this the Reddit source is
   skipped. It's free and takes two minutes:
   - Go to https://www.reddit.com/prefs/apps while logged into your own
     Reddit account.
   - Click "create app" → name it anything (e.g. "wi-cre-lead-finder") →
     type **script** → redirect uri `http://localhost:8080` → create app.
   - Copy the string under the app name (that's `REDDIT_CLIENT_ID`) and
     the "secret" field (`REDDIT_CLIENT_SECRET`) into `.env`.
   - Without this, Google News still works fine on its own — Reddit is
     just skipped for that run.

## Running it

```bash
cd lead-finder
python3 search.py
```

It prints what it found and how many new leads it upserted. Existing
URLs are skipped (so re-running doesn't duplicate or overwrite a status
you've already set in the dashboard).

## Scheduling it (cron)

Run it every 6 hours, logging output:

```bash
crontab -e
```

Add a line like:

```
0 */6 * * * cd /Users/josiahbarwick/cre-crm/lead-finder && /usr/bin/python3 search.py >> run.log 2>&1
```

(`run.log` is gitignored.) Adjust the schedule to taste — once a day is
plenty if you'd rather not get too much volume.

## Tuning

Everything that drives what counts as a "lead" lives in `config.py`:
subreddits searched, search queries (both Reddit and Google News), the
list of Wisconsin place names, and the buy/lease/property-type keyword
lists. `classify.py` has the scoring logic itself
(`SCORE_THRESHOLD` in `config.py` controls the cutoff — raise it for
fewer, higher-confidence leads; lower it for more recall).
