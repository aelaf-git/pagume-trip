from __future__ import annotations

from uuid import uuid4

from pagume_agents.models.inventory import Hotel, TourPackage, Vehicle
from pagume_agents.models.trip import TripContext, TripOption, TripOptionItem


def _best_room(hotel: Hotel, guests: int | None) -> dict | None:
    rooms = hotel.rooms
    if guests is not None:
        rooms = [r for r in rooms if r.capacity >= guests]
    if not rooms:
        return None
    room = sorted(rooms, key=lambda r: r.nightly_price_etb)[0]
    return room.model_dump()


def generate_trip_options(
    hotels: list[Hotel],
    vehicles: list[Vehicle],
    tours: list[TourPackage],
    context: TripContext,
) -> list[TripOption]:
    nights = context.nights
    days = context.duration_days or nights
    guests = context.guests
    budget = context.budget_etb
    prefer_comfortable = "comfortable" in (context.preferences or [])
    prefer_private = "private_vehicle" in (context.preferences or [])

    hotel_candidates: list[Hotel | None] = list(hotels) or [None]
    vehicle_candidates: list[Vehicle | None] = list(vehicles) or [None]
    tour_candidates: list[TourPackage | None] = list(tours) or [None]

    scored: list[tuple[tuple, TripOption]] = []
    for hotel in hotel_candidates:
        room = _best_room(hotel, guests) if hotel else None
        if hotel and room is None:
            continue
        hotel_cost = (room["nightly_price_etb"] * nights) if room else 0
        for vehicle in vehicle_candidates:
            if vehicle and guests and vehicle.seats < guests:
                continue
            vehicle_cost = (vehicle.daily_price_etb * days) if vehicle else 0
            for tour in tour_candidates:
                tour_cost = tour.price_etb if tour else 0
                items: list[TripOptionItem] = []
                if hotel and room:
                    items.append(
                        TripOptionItem(
                            kind="hotel",
                            entity_id=hotel.id,
                            name=hotel.name,
                            cost_etb=hotel_cost,
                            extra={"room_id": room["id"], "nights": nights},
                        )
                    )
                if vehicle:
                    items.append(
                        TripOptionItem(
                            kind="vehicle",
                            entity_id=vehicle.id,
                            name=vehicle.name,
                            cost_etb=vehicle_cost,
                            extra={"days": days, "seats": vehicle.seats},
                        )
                    )
                if tour:
                    items.append(
                        TripOptionItem(
                            kind="tour",
                            entity_id=tour.id,
                            name=tour.name,
                            cost_etb=tour_cost,
                            extra={"category": tour.category},
                        )
                    )
                if not items:
                    continue
                total = hotel_cost + vehicle_cost + tour_cost
                over = budget is not None and total > budget
                comfort_rank = 0
                if hotel and prefer_comfortable and hotel.comfort_level == "comfortable":
                    comfort_rank = -1
                private_rank = 0
                if vehicle and prefer_private:
                    private_rank = 0 if vehicle.service_type == "private_car" else 1
                option = TripOption(
                    option_id=f"opt_{uuid4().hex[:8]}",
                    label=" + ".join(item.name for item in items),
                    items=items,
                    total_etb=total,
                    over_budget=over,
                )
                scored.append(((over, comfort_rank, private_rank, total), option))

    scored.sort(key=lambda pair: pair[0])
    return [option for _, option in scored]
