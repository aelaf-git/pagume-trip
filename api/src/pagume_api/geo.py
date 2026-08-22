from datetime import date, timedelta
from math import atan2, cos, radians, sin, sqrt

# Soft regional labels the LLM often emits that are not literal DB substrings.
_REGION_ALIASES: dict[str, tuple[str, ...]] = {
    "northern ethiopia": (
        "amhara",
        "tigray",
        "lalibela",
        "gondar",
        "gorgora",
        "bahir dar",
        "axum",
        "simien",
    ),
    "north ethiopia": (
        "amhara",
        "tigray",
        "lalibela",
        "gondar",
        "gorgora",
        "bahir dar",
        "axum",
        "simien",
    ),
    "historic north": (
        "lalibela",
        "gondar",
        "axum",
        "bahir dar",
        "gorgora",
        "simien",
    ),
    "southern ethiopia": ("omo", "south ethiopia", "snnpr"),
    "south ethiopia": ("omo", "south ethiopia", "snnpr"),
    "danakil": ("danakil", "afar", "erta ale", "dallol"),
    "danakil depression": ("danakil", "afar", "erta ale", "dallol"),
}


def date_range(check_in: str, check_out: str) -> list[str]:
    start = date.fromisoformat(check_in)
    end = date.fromisoformat(check_out)
    if end <= start:
        return [check_in]
    days: list[str] = []
    current = start
    while current < end:
        days.append(current.isoformat())
        current += timedelta(days=1)
    return days


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    )
    return 2 * r * atan2(sqrt(a), sqrt(1 - a))


def destination_search_rank(name: str, haystack: str, query: str) -> int | None:
    """Lower is better. Exact name beats zone/description substring matches."""
    q = (query or "").strip().lower()
    if not q:
        return 0
    n = name.lower()
    h = haystack.lower()
    if n == q:
        return 0
    if q in n:
        return 1
    if q in h:
        return 2

    # Multi-word / regional queries: expand aliases, then match tokens.
    aliases = _REGION_ALIASES.get(q)
    if aliases and any(alias in h or alias in n for alias in aliases):
        return 3

    tokens = [t for t in q.replace(",", " ").split() if len(t) >= 3]
    if len(tokens) >= 2:
        hits = sum(1 for t in tokens if t in h or t in n)
        if hits == len(tokens):
            return 4
        # Enough signal from meaningful tokens (e.g. "northern" + place context)
        if hits >= max(2, len(tokens) - 1) and any(
            t in n or t in h for t in tokens if t not in {"the", "and", "for"}
        ):
            return 5

    return None
