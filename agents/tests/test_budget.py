from pagume_agents.models.inventory import Hotel, HotelRoom, TourPackage, Vehicle
from pagume_agents.models.trip import TripContext
from pagume_agents.nodes.budget import budget_node
from pagume_agents.planning import generate_trip_options


def test_budget_node_flags_over_budget_combinations():
    hotels = [
        Hotel(
            id="hotel_pricey",
            destination_id="dest_gorgora",
            name="Pricey Resort",
            latitude=12.2,
            longitude=37.3,
            rooms=[
                HotelRoom(
                    id="room_1",
                    hotel_id="hotel_pricey",
                    room_type="family",
                    capacity=6,
                    nightly_price_etb=20000,
                )
            ],
        )
    ]
    vehicles = [
        Vehicle(
            id="vehicle_pricey",
            destination_id="dest_gorgora",
            name="Luxury car",
            make="Toyota",
            model="Prado",
            seats=7,
            daily_price_etb=15000,
            service_type="private_car",
        )
    ]
    tours = [
        TourPackage(
            id="tour_pricey",
            destination_id="dest_gorgora",
            agency_id="agency_1",
            name="Boat Trip",
            price_etb=9000,
            category="boat",
        )
    ]
    context = TripContext(
        destination_id="dest_gorgora",
        duration_days=4,
        guests=6,
        budget_etb=10000,
    )
    options = generate_trip_options(hotels, vehicles, tours, context)
    assert options
    assert all(option.over_budget for option in options)
    assert options[0].total_etb == 20000 * 4 + 15000 * 4 + 9000

    state = {
        "trip_context": context.model_dump(),
        "agent_results": {
            "accommodation": {"results": [hotels[0].model_dump()]},
            "transport": {"results": [vehicles[0].model_dump()]},
            "tour": {"results": [tours[0].model_dump()]},
        },
    }
    result = budget_node(state)
    assert result["selected_option"]["over_budget"] is True
    assert result["agent_results"]["budget"]["violations"]
