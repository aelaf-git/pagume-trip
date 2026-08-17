from tests.conftest import invoke_message


def test_gondar_pipeline(graph):
    values, _ = invoke_message(
        graph,
        "Plan two days in Gondar for two people. Budget 25,000 ETB. "
        "Comfortable hotel, private car, and a castle tour.",
        "gondar-1",
    )
    dest = values["agent_results"]["destination"]["results"][0]
    assert dest["id"] == "dest_gondar"
    hotel_ids = {row["id"] for row in values["agent_results"]["accommodation"]["results"]}
    assert "hotel_gondar_castle" in hotel_ids
    tour_ids = {row["id"] for row in values["agent_results"]["tour"]["results"]}
    assert "tour_gondar_castles" in tour_ids
    option = values["selected_option"]
    assert option is not None
    assert option["over_budget"] is False


def test_lalibela_guest_house_in_inventory(graph):
    values, _ = invoke_message(
        graph,
        "Find me a hotel near Lalibela churches under 5,000 ETB per night.",
        "lalibela-cheap-1",
    )
    hotels = values["agent_results"].get("accommodation", {}).get("results") or []
    names = {row["name"] for row in hotels}
    assert "Lalibela Guest House" in names or "Lalibela Mountain View Hotel" in names
    assert all("Hotel ABC" != row.get("name") for row in hotels)
