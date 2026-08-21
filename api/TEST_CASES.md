# Pagume test cases (Postman)

Restart `pagume-api` after pulling this seed so new destinations are inserted. Agents stay on `http://127.0.0.1:8100`. Use a **new `thread_id`** for every case.

Base URL for chat: `POST http://127.0.0.1:8100/v1/runs`

Inventory check: `GET http://127.0.0.1:8000/v1/destinations`

Seeded destinations: Gorgora, Lalibela, Gondar, Bahir Dar, Axum, Harar, Simien Mountains, Addis Ababa, Omo Valley.

---

## 1. Gorgora family trip (happy path)

**POST** `/v1/runs`

```json
{
  "thread_id": "tc-gorgora",
  "message": "I want to visit Gorgora for four days with my family. We are six people. Our budget is 60,000 ETB. We want a comfortable hotel, a private vehicle, and a boat trip."
}
```

Expect hotels + Land Cruiser + boat trip, total around **44,000 ETB**, not over budget.

Then **POST** `/v1/runs/tc-gorgora/messages` with `{"message": "Book Trip"}`  
Then **POST** `/v1/runs/tc-gorgora/approve` with `{"approved": true}`

---

## 2. Lalibela couple, FRS example

```json
{
  "thread_id": "tc-lalibela",
  "message": "I want to visit Lalibela for four days with my wife. Our total budget is 40,000 ETB. We want a comfortable hotel, a guided tour, and we don't want to drive ourselves."
}
```

Expect Lalibela hotels, 4WD with driver, churches tour.

---

## 3. Hotel under 5,000 ETB (FRS search)

```json
{
  "thread_id": "tc-cheap-hotel",
  "message": "Find me a hotel near Lalibela churches under 5,000 ETB per night."
}
```

Expect **Lalibela Guest House** (3,200 ETB) and/or Mountain View (4,800). Must not invent Hotel ABC.

Direct inventory: `GET http://127.0.0.1:8000/v1/hotels?destination_id=dest_lalibela&max_price_etb=5000&guests=2`

---

## 4. 4WD for six people (FRS search)

```json
{
  "thread_id": "tc-4wd",
  "message": "Find a 4WD for six people in Gorgora."
}
```

Expect Land Cruiser / Prado, not the 12-seat Hiace as the 4WD pick.

---

## 5. Three-day northern tour

```json
{
  "thread_id": "tc-north-tour",
  "message": "Show me a three-day tour of northern Ethiopia."
}
```

Expect **Three-day Northern Ethiopia Tour** (Lalibela, 28,000 ETB).

---

## 6. Gondar castles

```json
{
  "thread_id": "tc-gondar",
  "message": "Plan two days in Gondar for two people. Budget 25,000 ETB. Comfortable hotel, private car, and a castle tour."
}
```

Expect Castle View Hotel, private car, Gondar Castles Guided Tour.

---

## 7. Bahir Dar family + boat

```json
{
  "thread_id": "tc-bahirdar",
  "message": "We are six people visiting Bahir Dar for three days. Budget 50,000 ETB. We want a lakeside hotel, a minibus, and a boat trip."
}
```

Expect Bahir Dar Lakeside Resort, family minibus, Blue Nile Falls / Lake Tana boat trip.

---

## 8. Axum history

```json
{
  "thread_id": "tc-axum",
  "message": "Two of us want two days in Axum. Budget 20,000 ETB. Comfortable hotel, a driver, and a stelae tour."
}
```

Expect Axum Stelae Hotel, private car, Axum stelae tour.

---

## 9. Harar coffee / culture

```json
{
  "thread_id": "tc-harar",
  "message": "I want two days in Harar with my partner. Budget 15,000 ETB. A simple hotel, a car with driver, and a coffee ceremony."
}
```

Expect Harar Jegol Inn (2,500/night), city car, coffee ceremony tour.

---

## 10. Simien 4WD trek

```json
{
  "thread_id": "tc-simien",
  "message": "Three days in the Simien Mountains for two people. Budget 45,000 ETB. Comfortable lodge, 4WD, and a hiking tour."
}
```

Expect Simien Mountain Lodge, Land Cruiser 4WD, day trek.

---

## 11. No hallucination (must fail inventory)

```json
{
  "thread_id": "tc-empty",
  "message": "Find me Hotel ABC near the churches under 5,000 ETB per night."
}
```

Expect: not in Pagume inventory. Must **not** invent Hotel ABC.

Same for: `"Plan a trip to Dubai for four days."`

---

## 12. Over budget (Gorgora still plans, flags overspend)

```json
{
  "thread_id": "tc-overbudget",
  "message": "Gorgora for four days, six people, comfortable hotel, private vehicle, boat trip. Budget is 10,000 ETB."
}
```

Expect a trip option with **over_budget** true (cheapest combo is still ~44,000 ETB).

---

## 13. Addis Ababa layover

```json
{
  "thread_id": "tc-addis",
  "message": "Two of us have two days in Addis Ababa. Budget 20,000 ETB. Comfortable hotel near Bole, a driver, and a city tour."
}
```

Expect Bole Gateway Hotel, airport transfer, Addis city and museum tour.

---

## 14. Omo Valley 4WD

```json
{
  "thread_id": "tc-omo",
  "message": "Three days in the Omo Valley for two people. Budget 40,000 ETB. Comfortable lodge, 4WD, and a market tour."
}
```

Expect Jinka Eco Lodge, Omo Valley 4WD, market and community visit.

---

## Direct API checks (port 8000)

| What | Request |
|---|---|
| All destinations | `GET /v1/destinations?q=` |
| Nearby Gondar | `GET /v1/destinations/dest_gondar/nearby?radius_km=150` (Gorgora should appear) |
| Bahir Dar hotels | `GET /v1/hotels?destination_id=dest_bahir_dar&guests=6` |
| Simien 4WD | `GET /v1/car-rentals?destination_id=dest_simien&is_4wd=true` |
| Harar tours | `GET /v1/tours?destination_id=dest_harar&q=coffee` |
| Addis hotels | `GET /v1/hotels?destination_id=dest_addis&guests=2` |
| Omo 4WD | `GET /v1/car-rentals?destination_id=dest_omo&is_4wd=true` |
