from pagume_agents.extract import (
    apply_trip_patch,
    extract_trip_context,
    is_trip_intent,
    missing_for_this_turn,
    resolve_trip_context,
)
from pagume_agents.models.trip import TripContext, TripContextPatch
from datetime import date
from unittest.mock import MagicMock


def test_extracts_canonical_destination_names():
    assert extract_trip_context("two days in Bahir Dar").destination_query == "Bahir Dar"
    assert extract_trip_context("Simien Mountains trek").destination_query == "Simien Mountains"
    assert extract_trip_context("Addis Ababa layover").destination_query == "Addis Ababa"
    assert extract_trip_context("Gonder castles").destination_query == "Gondar"
    assert extract_trip_context("Omo Valley visit").destination_query == "Omo Valley"


def test_ethiopia_without_city_is_catalog_browse():
    ctx = extract_trip_context("I want to visit Ethiopia. Recommend places.")
    assert ctx.browse_destinations is True
    assert ctx.destination_query is None
    assert ctx.wants_hotel is False
    assert ctx.wants_transport is False


def test_open_ended_plan_trip_is_catalog_browse():
    ctx = extract_trip_context("Plan a trip for me")
    assert ctx.browse_destinations is True
    assert ctx.destination_query is None


def test_city_in_ethiopia_still_locks_destination():
    ctx = extract_trip_context("Lalibela in Ethiopia for four days")
    assert ctx.browse_destinations is False
    assert ctx.destination_query == "Lalibela"


def test_picking_city_after_browse_restores_hotel_transport():
    existing = extract_trip_context("I want to visit Ethiopia. Recommend places.")
    ctx = extract_trip_context("Lalibela for two people", existing)
    assert ctx.browse_destinations is False
    assert ctx.destination_query == "Lalibela"
    assert ctx.wants_hotel is True
    assert ctx.wants_transport is True
    assert ctx.guests == 2


def test_greeting_is_not_trip_intent():
    text = "Hey I am Aelaf who are you?"
    ctx = extract_trip_context(text)
    assert is_trip_intent(text, ctx) is False
    assert ctx.destination_query is None


def test_lalibela_plan_is_trip_intent():
    text = "Plan two days in Lalibela"
    ctx = extract_trip_context(text)
    assert is_trip_intent(text, ctx) is True
    assert ctx.destination_query == "Lalibela"
    assert ctx.wants_hotel is True
    assert ctx.wants_transport is True


def test_hotel_only_request_does_not_enable_transport():
    ctx = extract_trip_context("Find me a hotel near Lalibela churches")
    assert ctx.destination_query == "Lalibela"
    assert ctx.wants_hotel is True
    assert ctx.wants_transport is False


def test_traveling_alone_sets_one_guest():
    ctx = extract_trip_context("I am traveling alone")
    assert ctx.guests == 1


def test_date_range_sets_check_in_out_and_duration():
    ctx = extract_trip_context("Okay from June 20 - August 20")
    year = date.today().year
    assert ctx.check_in == f"{year}-06-20"
    assert ctx.check_out == f"{year}-08-20"
    assert ctx.duration_days == (date(year, 8, 20) - date(year, 6, 20)).days


def test_two_months_sets_duration_without_dates():
    ctx = extract_trip_context("I want to have fun for two months")
    assert ctx.duration_days == 60
    assert ctx.check_in is None


def test_visit_all_of_them_after_browse_sets_circuit():
    existing = extract_trip_context("I want to visit Ethiopia. Recommend places.")
    ctx = extract_trip_context("I want to visit all of them. one by one.", existing)
    assert ctx.browse_destinations is True
    assert ctx.wants_circuit is True
    assert ctx.destination_query is None
    assert ctx.destination_id is None


def test_missing_empty_for_small_talk():
    ctx = extract_trip_context("Hey I am Aelaf who are you?")
    assert missing_for_this_turn("Hey I am Aelaf who are you?", ctx) == []


def test_missing_empty_for_catalog_browse():
    ctx = extract_trip_context("I want to visit Ethiopia. Recommend places.")
    assert ctx.browse_destinations is True
    assert missing_for_this_turn("I want to visit Ethiopia. Recommend places.", ctx) == []


def test_missing_one_gap_for_circuit_without_guests():
    existing = extract_trip_context("I want to visit Ethiopia. Recommend places.")
    ctx = extract_trip_context("I want to visit all of them. one by one.", existing)
    ctx.budget_etb = 1_000_000
    gaps = missing_for_this_turn("I want to visit all of them. one by one.", ctx)
    assert gaps == ["number of guests"]


def test_missing_none_when_circuit_slots_filled():
    ctx = TripContext(
        browse_destinations=True,
        wants_circuit=True,
        guests=1,
        check_in="2026-06-20",
        check_out="2026-08-20",
        budget_etb=1_000_000,
    )
    assert missing_for_this_turn("Okay from June 20 - August 20", ctx) == []


def test_llm_patch_fills_messy_solo_without_wiping_budget():
    existing = TripContext(browse_destinations=True, budget_etb=1_000_000)
    heuristic = extract_trip_context("me go myself only", existing)
    patched = apply_trip_patch(heuristic, TripContextPatch(guests=1))
    assert patched.guests == 1
    assert patched.budget_etb == 1_000_000
    assert patched.destination_id is None


def test_resolve_uses_llm_patch_then_falls_back():
    existing = TripContext(browse_destinations=True, budget_etb=500_000)
    mock_llm = MagicMock()
    structured = MagicMock()
    structured.invoke.return_value = TripContextPatch(guests=1, wants_circuit=True)
    mock_llm.with_structured_output.return_value = structured
    ctx = resolve_trip_context(
        "i wanna see all place one by one, me only",
        existing,
        llm=mock_llm,
    )
    assert ctx.guests == 1
    assert ctx.wants_circuit is True
    assert ctx.budget_etb == 500_000

    mock_llm.with_structured_output.side_effect = RuntimeError("down")
    fallback = resolve_trip_context("I am traveling alone", existing, llm=mock_llm)
    assert fallback.guests == 1
    assert fallback.budget_etb == 500_000

