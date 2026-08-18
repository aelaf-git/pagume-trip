from pagume_agents.extract import extract_trip_context


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


def test_city_in_ethiopia_still_locks_destination():
    ctx = extract_trip_context("Lalibela in Ethiopia for four days")
    assert ctx.browse_destinations is False
    assert ctx.destination_query == "Lalibela"
