from tests.conftest import GORGORA_MESSAGE, invoke_message


def test_gorgora_pipeline_routes_specialists(graph, mock_client):
    values, _ = invoke_message(graph, GORGORA_MESSAGE, "gorgora-1")
    results = values["agent_results"]
    assert results["destination"]["results"][0]["id"] == "dest_gorgora"
    assert results["accommodation"]["results"]
    assert results["transport"]["results"]
    assert results["tour"]["results"]
    assert results["budget"]["results"]
    assert results["itinerary"]["results"]

    labels = [item["label"] for item in values["progress"]]
    assert "Found destination" in labels
    assert "Searching hotels" in labels
    assert "Comparing transportation" in labels
    assert "Finding tours" in labels
    assert "Calculating budget" in labels
    assert "Building itinerary" in labels

    option = values["selected_option"]
    assert option is not None
    assert option["over_budget"] is False
    assert option["total_etb"] == 44000
    kinds = {item["kind"]: item for item in option["items"]}
    assert kinds["hotel"]["entity_id"] == "hotel_gorgora_resort_a"
    assert kinds["vehicle"]["entity_id"] == "vehicle_gorgora_a"
    assert kinds["tour"]["entity_id"] == "tour_gorgora_boat_a"
    assert len(values["itinerary"]) >= 4
    assert "Gorgora" in (values["final_message"] or "")
    assert "44,000" in (values["final_message"] or "")
