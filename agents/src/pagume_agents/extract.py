import re

from pagume_agents.models.trip import TripContext

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
    ("danakil", "Danakil"),
)


def _parse_int_token(token: str) -> int | None:
    token = token.lower().replace(",", "")
    if token.isdigit():
        return int(token)
    return WORD_NUMBERS.get(token)


def extract_trip_context(text: str, existing: TripContext | None = None) -> TripContext:
    ctx = existing.model_copy() if existing else TripContext()
    lowered = text.lower()

    matched_city = False
    for alias, canonical in KNOWN_DESTINATIONS:
        if alias in lowered:
            ctx.destination_query = canonical
            ctx.browse_destinations = False
            matched_city = True
            break

    if not matched_city and ("ethiopia" in lowered or "ethiopian" in lowered):
        ctx.browse_destinations = True
        ctx.destination_query = None
        ctx.wants_hotel = False
        ctx.wants_transport = False

    budget_match = re.search(
        r"([\d,]+(?:\.\d+)?)\s*(etb|birr)", lowered, flags=re.IGNORECASE
    )
    if budget_match:
        ctx.budget_etb = float(budget_match.group(1).replace(",", ""))

    days_match = re.search(r"(\d+|one|two|three|four|five|six|seven)\s*-?\s*days?", lowered)
    if days_match:
        parsed = _parse_int_token(days_match.group(1))
        if parsed:
            ctx.duration_days = parsed

    people_match = re.search(
        r"(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(people|persons|travelers|guests|adults)",
        lowered,
    )
    wife_match = re.search(r"\b(wife|husband|partner)\b", lowered)
    if people_match:
        parsed = _parse_int_token(people_match.group(1))
        if parsed:
            ctx.guests = parsed
    elif wife_match:
        ctx.guests = 2
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

    return ctx


def wants_booking(text: str) -> bool:
    lowered = text.lower()
    return any(
        phrase in lowered
        for phrase in ("book trip", "book it", "confirm booking", "yes, book", "please book")
    )
