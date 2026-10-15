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
]

# Queries run inside each subreddit above (via restrict_sr=on).
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
]

# Google News RSS search queries (no API key required). Each query is already
# Wisconsin-scoped by construction, so its result gets that location "for
# free" even if the short RSS snippet doesn't repeat the place name verbatim
# (mirrors how subreddit-scoped Reddit searches are trusted below).
GOOGLE_NEWS_QUERIES = [
    ("Wisconsin company relocating", "Wisconsin"),
    ("Wisconsin company expanding", "Wisconsin"),
    ("Wisconsin new headquarters", "Wisconsin"),
    ("Wisconsin warehouse lease", "Wisconsin"),
    ("Wisconsin office space lease", "Wisconsin"),
    ("Wisconsin new facility", "Wisconsin"),
    ("Wisconsin signs lease", "Wisconsin"),
    ("Milwaukee company relocating", "Milwaukee, WI"),
    ("Madison company expanding", "Madison, WI"),
    ("Wisconsin industrial building sale", "Wisconsin"),
    ("Wisconsin retail space", "Wisconsin"),
    ("Wisconsin company moving", "Wisconsin"),
    ("Wisconsin new distribution center", "Wisconsin"),
    ("Wisconsin breaks ground new facility", "Wisconsin"),
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

BUY_KEYWORDS = [
    "looking to buy", "in the market for", "want to purchase", "seeking to acquire",
    "buyer for", "looking to acquire", "looking to purchase", "want to buy",
]

LEASE_KEYWORDS = [
    "looking to lease", "need office space", "seeking office space",
    "looking for warehouse", "need warehouse space", "looking for retail space",
    "need retail space", "space for rent", "looking to rent", "tenant rep",
    "seeking space", "relocating to", "expanding into", "new location in",
    "looking for space", "need space", "lease space", "space available",
    "relocating", "is expanding", "new headquarters", "new facility",
    "signs lease", "leases space", "leased space", "new distribution center",
    "breaks ground", "opening a new location", "moving into", "new warehouse",
    "will relocate", "plans to move", "new office",
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
