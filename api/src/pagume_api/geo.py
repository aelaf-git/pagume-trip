from datetime import date, timedelta
from math import atan2, cos, radians, sin, sqrt


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
    if n == q:
        return 0
    if q in n:
        return 1
    if q in haystack.lower():
        return 2
    return None

