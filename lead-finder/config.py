"""Search terms, place names, and scoring keywords for the Wisconsin CRE lead finder."""

# Subreddits worth searching directly. Posts here count as Wisconsin-located
# even if the post text itself doesn't name a city.
SUBREDDITS = [
    ("Wisconsin", None),
    ("milwaukee", "Milwaukee, WI"),
    ("madisonwi", "Madison, WI"),
    ("GreenBay", "Green Bay, WI"),
    ("CommercialRealEstate", None),
    ("smallbusiness", None),
    ("Entrepreneur", None),
    ("realestateinvesting", None),
    ("landlord", None),
]

# Queries run inside each subreddit above (via restrict_sr=on). Covers all
# three angles: tenants/buyers seeking space (demand) and owners wanting to
# sell or lease out a property (supply).
SUBREDDIT_QUERIES = [
    "office space",
    "warehouse",
    "retail space",
    "commercial space",
    "industrial space",
    "lease space",
    "buying a building",
    "relocating business",
    "new location",
    "selling our building",
    "selling my building",
    "sell commercial property",
    "space available for lease",
    "looking for a tenant",
    "vacant commercial space",
    "for sale by owner commercial",
]

# Queries run against all of Reddit (not subreddit-restricted), kept
# Wisconsin-specific so volume stays manageable without auth.
SITEWIDE_REDDIT_QUERIES = [
    "office space Wisconsin",
    "warehouse Wisconsin",
    "retail space Milwaukee",
    "commercial building Wisconsin",
    "industrial space Wisconsin",
    "lease space Madison",
    "business relocating Wisconsin",
    "commercial building for sale Wisconsin",
    "selling commercial property Wisconsin",
    "landlord seeking tenant Wisconsin",
    "commercial property Wisconsin for sale",
]

# Google News RSS search queries (no API key required). Google News does
# loose relevance matching rather than strict AND of terms, so these queries
# only steer what gets searched — classify.py still requires an actual
# Wisconsin place name in the article text before treating a result as
# relevant (see sources.py).
GOOGLE_NEWS_QUERIES = [
    "Wisconsin company relocating",
    "Wisconsin company expanding",
    "Wisconsin new headquarters",
    "Wisconsin warehouse lease",
    "Wisconsin office space lease",
    "Wisconsin new facility",
    "Wisconsin signs lease",
    "Milwaukee company relocating",
    "Madison company expanding",
    "Wisconsin industrial building sale",
    "Wisconsin retail space",
    "Wisconsin company moving",
    "Wisconsin new distribution center",
    "Wisconsin breaks ground new facility",
    "Wisconsin commercial building for sale",
    "Wisconsin office building for sale",
    "Wisconsin warehouse for sale",
    "Wisconsin owner selling building",
    "Wisconsin landlord seeking tenant",
    "Wisconsin commercial property for sale",
    "Wisconsin retail building for sale",
]

# Order matters: specific city names are checked before the generic
# "wisconsin" / "WI" abbreviation entries, so a city name wins when both
# are present (e.g. "Madison, WI" should report "Madison", not "Wi").
WI_PLACES = [
    "milwaukee", "madison", "green bay", "appleton",
    "waukesha", "kenosha", "racine", "eau claire", "la crosse", "wausau",
    "oshkosh", "sheboygan", "fond du lac", "janesville", "west allis",
    "brookfield", "new berlin", "wauwatosa", "menomonee falls", "pewaukee",
    "oconomowoc", "neenah", "menasha", "beloit", "manitowoc", "stevens point",
    "wisconsin rapids", "superior wi", "fitchburg", "sun prairie", "middleton",
    "franklin wi", "greenfield wi", "mequon",
    "wisconsin", " wi ", ", wi",
]

# ---- Demand-side (someone wants to acquire/occupy space) ----
BUY_KEYWORDS = [
    "looking to buy", "in the market for", "want to purchase", "seeking to acquire",
    "buyer for", "looking to acquire", "looking to purchase", "want to buy",
]

LEASE_KEYWORDS = [
    "looking to lease", "need office space", "seeking office space",
    "looking for warehouse", "need warehouse space", "looking for retail space",
    "need retail space", "looking to rent", "tenant rep",
    "seeking space", "relocating to", "expanding into", "new location in",
    "looking for space", "need space", "lease space",
    "relocating", "is expanding", "new headquarters", "new facility",
    "signs lease", "leases space", "leased space", "new distribution center",
    "breaks ground", "opening a new location", "moving into", "new warehouse",
    "will relocate", "plans to move", "new office",
]

# ---- Supply-side (an owner/landlord wants to dispose of or fill space) ----
SELL_KEYWORDS = [
    "looking to sell", "want to sell our building", "want to sell my building",
    "selling our building", "selling my building", "selling our office",
    "selling the building", "putting our building up for sale",
    "for sale by owner commercial", "fsbo commercial", "thinking of selling",
    "sell my commercial property", "sell our commercial property",
    "listing our property for sale", "owner looking to sell",
    "building for sale by owner",
]

LEASE_OUT_KEYWORDS = [
    "space available for lease", "have space to lease", "landlord looking for tenant",
    "vacant space for lease", "leasing out our building", "need a tenant",
    "looking for a tenant", "space for lease by owner", "space available",
    "available for lease", "seeking tenant", "vacant commercial space",
]

PROPERTY_TYPE_KEYWORDS = {
    "Office": ["office space", "office building", "coworking"],
    "Industrial": ["warehouse", "industrial space", "distribution center", "flex space"],
    "Retail": ["retail space", "storefront", "retail building"],
    "Multifamily": ["apartment building", "multifamily", "apartment complex"],
    "Land": ["vacant land", "acreage", "land for sale"],
    "Medical": ["medical office", "medical building", "clinic space"],
    "Hospitality": ["hotel", "motel"],
}

# Minimum score to keep a result worth showing the broker.
SCORE_THRESHOLD = 50
