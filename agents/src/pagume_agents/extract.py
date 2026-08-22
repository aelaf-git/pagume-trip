import re
from datetime import date
from typing import Any

from pagume_agents.models.trip import TripContext, TripContextPatch

WORD_NUMBERS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
}

MONTH_ALIASES = {
    "january": 1,
    "jan": 1,
    "february": 2,
    "feb": 2,
    "march": 3,
    "mar": 3,
    "april": 4,
    "apr": 4,
    "may": 5,
    "june": 6,
    "jun": 6,
    "july": 7,
    "jul": 7,
    "august": 8,
    "aug": 8,
    "september": 9,
    "sept": 9,
    "sep": 9,
    "october": 10,
    "oct": 10,
    "november": 11,
    "nov": 11,
    "december": 12,
    "dec": 12,
}

_MONTH_RE = "|".join(sorted(MONTH_ALIASES, key=len, reverse=True))

CIRCUIT_PHRASES = (
    "all of them",
    "all of these",
    "every one",
    "one by one",
    "whole country",
    "every place",
    "all of it",
    "every destination",
    "all the places",
)

SOLO_PHRASES = (
    "traveling alone",
    "travelling alone",
    "travel alone",
    "by myself",
    "just me",
    "on my own",
)

# Longer phrases first so "bahir dar" wins over a shorter substring.
KNOWN_DESTINATIONS = (
    ("addis ababa", "Addis Ababa"),
    ("bahir dar", "Bahir Dar"),
    ("simien mountains", "Simien Mountains"),
    ("omo valley", "Omo Valley"),
    ("gorgora", "Gorgora"),
    ("lalibela", "Lalibela"),
    ("gonder", "Gondar"),
    ("gondar", "Gondar"),
    ("aksum", "Axum"),
    ("axum", "Axum"),
    ("harar", "Harar"),
    ("simien", "Simien Mountains"),
    ("omo", "Omo Valley"),
    ("danakil depression", "Danakil Depression"),
    ("danakil", "Danakil Depression"),
)


def _parse_int_token(token: str) -> int | None:
    token = token.lower().replace(",", "")
    if token.isdigit():
        return int(token)
    return WORD_NUMBERS.get(token)


def _parse_month_day(
    month_token: str, day_token: str, year_token: str | None, default_year: int
) -> date | None:
    month = MONTH_ALIASES.get(month_token.lower())
    try:
        day = int(day_token)
        year = int(year_token) if year_token else default_year
        return date(year, month, day) if month else None
    except (TypeError, ValueError):
        return None


def _extract_date_range(lowered: str) -> tuple[date, date] | None:
    pattern = (
        rf"(?:from\s+)?(?P<m1>{_MONTH_RE})\s+(?P<d1>\d{{1,2}})(?:st|nd|rd|th)?"
        rf"(?:\s*,?\s*(?P<y1>\d{{4}}))?"
        rf"\s*(?:-|–|—|to)\s*"
        rf"(?P<m2>{_MONTH_RE})\s+(?P<d2>\d{{1,2}})(?:st|nd|rd|th)?"
        rf"(?:\s*,?\s*(?P<y2>\d{{4}}))?"
    )
    match = re.search(pattern, lowered)
    if not match:
        return None
    year = date.today().year
    start = _parse_month_day(match.group("m1"), match.group("d1"), match.group("y1"), year)
    end = _parse_month_day(match.group("m2"), match.group("d2"), match.group("y2"), year)
    if not start or not end:
        return None
    if end < start:
        end = date(end.year + 1, end.month, end.day)
    return start, end


def _is_circuit_request(lowered: str) -> bool:
    return any(phrase in lowered for phrase in CIRCUIT_PHRASES)


def extract_trip_context(text: str, existing: TripContext | None = None) -> TripContext:
    ctx = existing.model_copy() if existing else TripContext()
    lowered = text.lower()

    matched_city = False
    for alias, canonical in KNOWN_DESTINATIONS:
        if alias in lowered:
            ctx.destination_query = canonical
            leaving_browse = ctx.browse_destinations
            ctx.browse_destinations = False
            matched_city = True
            if leaving_browse:
                ctx.wants_hotel = True
                ctx.wants_transport = True
                ctx.wants_circuit = False
            break

    # Country / open-ended planning: list verified places (do not search the raw sentence).
    open_ended_plan = bool(
        re.search(
            r"\b(plan|planning|organize|book)\b.{0,40}\b(trip|vacation|holiday|itinerary|travel)\b",
            lowered,
        )
        or re.search(r"\brecommend\b.{0,30}\b(places?|destinations?|where)\b", lowered)
        or re.search(r"\bwhere (should|can|do) i\b", lowered)
    )
    if not matched_city and (
        "ethiopia" in lowered or "ethiopian" in lowered or open_ended_plan
    ):
        ctx.browse_destinations = True
        ctx.destination_query = None
        ctx.wants_hotel = False
        ctx.wants_transport = False

    if not matched_city and _is_circuit_request(lowered) and (
        ctx.browse_destinations or (existing and existing.browse_destinations)
    ):
        ctx.wants_circuit = True
        ctx.browse_destinations = True

    budget_match = re.search(
        r"([\d,]+(?:\.\d+)?)\s*(etb|birr)", lowered, flags=re.IGNORECASE
    )
    if budget_match:
        ctx.budget_etb = float(budget_match.group(1).replace(",", ""))

    date_range = _extract_date_range(lowered)
    if date_range:
        start, end = date_range
        ctx.check_in = start.isoformat()
        ctx.check_out = end.isoformat()
        ctx.duration_days = max((end - start).days, 1)
    else:
        months_match = re.search(
            r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*-?\s*months?",
            lowered,
        )
        days_match = re.search(
            r"(\d+|one|two|three|four|five|six|seven)\s*-?\s*days?", lowered
        )
        if months_match:
            parsed = _parse_int_token(months_match.group(1))
            if parsed:
                ctx.duration_days = parsed * 30
        elif days_match:
            parsed = _parse_int_token(days_match.group(1))
            if parsed:
                ctx.duration_days = parsed

    people_match = re.search(
        r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(people|persons|travelers|guests|adults)",
        lowered,
    )
    wife_match = re.search(r"\b(wife|husband|partner)\b", lowered)
    solo = any(phrase in lowered for phrase in SOLO_PHRASES) or re.search(
        r"\balone\b|\bsolo\b", lowered
    )
    if people_match:
        parsed = _parse_int_token(people_match.group(1))
        if parsed:
            ctx.guests = parsed
    elif wife_match:
        ctx.guests = 2
    elif solo:
        ctx.guests = 1
    elif "family" in lowered and ctx.guests is None:
        ctx.guests = 4

    if any(word in lowered for word in ("boat", "tour", "package", "guided")):
        ctx.wants_tour = True
    if "boat" in lowered:
        ctx.tour_query = "boat"
    if any(word in lowered for word in ("hotel", "resort", "lodge", "accommodation")):
        ctx.wants_hotel = True
    if any(word in lowered for word in ("private vehicle", "private car", "driver", "transport")):
        ctx.wants_transport = True
        ctx.preferences = list({*ctx.preferences, "private_vehicle"})
    if any(word in lowered for word in ("car rental", "rent a car", "4wd", "land cruiser")):
        ctx.wants_car_rental = True
    if "comfortable" in lowered:
        ctx.preferences = list({*ctx.preferences, "comfortable"})

    if matched_city and _is_full_plan_request(lowered):
        ctx.wants_hotel = True
        ctx.wants_transport = True

    return ctx


def _is_full_plan_request(lowered: str) -> bool:
    """Named-city messages that ask for a package, not a single specialist."""
    if re.search(r"\b(plan|planning)\b", lowered) and re.search(r"\b(trip|days?)\b", lowered):
        return True
    if re.search(r"\bvisit\b", lowered) and re.search(r"\b\d+\s*-?\s*days?\b", lowered):
        return True
    if re.search(r"\b(for|in)\s+(\d+|one|two|three|four|five|six|seven)\s*-?\s*days?\b", lowered):
        return True
    if re.search(r"\b(go to|travel to|head to|want to go|wanna go)\b", lowered):
        return True
    return False


def wants_booking(text: str) -> bool:
    lowered = text.lower()
    return any(
        phrase in lowered
        for phrase in ("book trip", "book it", "confirm booking", "yes, book", "please book")
    )


TRIP_KEYWORDS = (
    "trip",
    "travel",
    "itinerary",
    "visit",
    "hotel",
    "resort",
    "lodge",
    "tour",
    "ethiopia",
    "ethiopian",
    "etb",
    "birr",
    "days",
    "recommend",
    "book",
    "plan",
    "destination",
    "guesthouse",
    "guest house",
    "car rental",
    "flight",
)


def is_trip_intent(text: str, ctx: TripContext | None = None) -> bool:
    """True when the user is asking to plan or browse a trip, not ordinary chat."""
    if wants_booking(text):
        return True
    if ctx is not None and (
        ctx.destination_id
        or ctx.destination_query
        or ctx.browse_destinations
        or ctx.wants_circuit
    ):
        return True
    lowered = text.lower()
    if any(alias in lowered for alias, _ in KNOWN_DESTINATIONS):
        return True
    return any(keyword in lowered for keyword in TRIP_KEYWORDS)


def canonicalize_destination(query: str) -> str:
    lowered = query.lower().strip()
    for alias, canonical in KNOWN_DESTINATIONS:
        if alias in lowered or lowered in alias:
            return canonical
    return query.strip().title()


def apply_trip_patch(base: TripContext, patch: TripContextPatch) -> TripContext:
    """Overlay non-null LLM slots onto heuristic context. Never touches destination_id."""
    ctx = base.model_copy()
    updates = patch.model_dump(exclude_none=True)
    dest_id = ctx.destination_id
    dest_name = ctx.destination_name
    for key, value in updates.items():
        if hasattr(ctx, key):
            setattr(ctx, key, value)
    ctx.destination_id = dest_id
    ctx.destination_name = dest_name

    if patch.destination_query:
        ctx.destination_query = canonicalize_destination(patch.destination_query)
        leaving_browse = base.browse_destinations or ctx.browse_destinations
        ctx.browse_destinations = False
        if patch.wants_circuit is None:
            ctx.wants_circuit = False
        if leaving_browse:
            if patch.wants_hotel is None:
                ctx.wants_hotel = True
            if patch.wants_transport is None:
                ctx.wants_transport = True

    if patch.wants_circuit and not patch.destination_query:
        ctx.wants_circuit = True
        ctx.browse_destinations = True

    if patch.check_in and patch.check_out and patch.duration_days is None:
        try:
            start = date.fromisoformat(patch.check_in)
            end = date.fromisoformat(patch.check_out)
            ctx.duration_days = max((end - start).days, 1)
        except ValueError:
            pass
    return ctx


def missing_for_this_turn(text: str, ctx: TripContext) -> list[str]:
    """Intake gaps for planning only. Empty for small talk and catalog browse."""
    if not is_trip_intent(text, ctx) or wants_booking(text):
        return []
    if ctx.browse_destinations and not ctx.wants_circuit and not ctx.destination_id:
        return []
    planning = bool(
        ctx.wants_circuit
        or ctx.destination_id
        or (
            ctx.destination_query
            and (ctx.wants_hotel or ctx.wants_transport or ctx.wants_tour or ctx.wants_car_rental)
        )
    )
    if not planning:
        return []
    gaps: list[str] = []
    if not ctx.guests:
        gaps.append("number of guests")
    if not ctx.check_in or not ctx.check_out:
        gaps.append("travel dates (check-in / check-out)")
    if not ctx.budget_etb:
        gaps.append("budget in ETB")
    return gaps[:1]


def resolve_trip_context(
    text: str,
    existing: TripContext | None = None,
    *,
    llm: Any | None = None,
    conversation: str = "",
) -> TripContext:
    """Heuristic extract, then LLM slots when Groq is available."""
    from langchain_core.messages import HumanMessage, SystemMessage

    from pagume_agents.extract_prompt import EXTRACT_SYSTEM

    heuristic = extract_trip_context(text, existing)
    if llm is None:
        return heuristic
    try:
        structured = llm.with_structured_output(TripContextPatch)
        payload = (
            f"Saved trip context JSON:\n{(existing or TripContext()).model_dump_json()}\n"
            f"conversation:\n{conversation or '(no prior turns)'}\n"
            f"latest_user_message: {text or '(none)'}"
        )
        patch = structured.invoke(
            [
                SystemMessage(content=EXTRACT_SYSTEM),
                HumanMessage(content=payload),
            ]
        )
        if isinstance(patch, TripContextPatch):
            return apply_trip_patch(heuristic, patch)
    except Exception:  # noqa: BLE001
        return heuristic
    return heuristic
