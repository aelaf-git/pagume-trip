from pagume_agents.extract import extract_trip_context


def test_extracts_canonical_destination_names():
    assert extract_trip_context("two days in Bahir Dar").destination_query == "Bahir Dar"
    assert extract_trip_context("Simien Mountains trek").destination_query == "Simien Mountains"
    assert extract_trip_context("Addis Ababa layover").destination_query == "Addis Ababa"
    assert extract_trip_context("Gonder castles").destination_query == "Gondar"
    assert extract_trip_context("Omo Valley visit").destination_query == "Omo Valley"
