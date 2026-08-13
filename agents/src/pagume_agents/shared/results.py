def summarize_inventory(rows: list[dict]) -> list[dict]:
    summary = []
    for row in rows:
        summary.append(
            {
                "id": row.get("id"),
                "name": row.get("name"),
                "price_etb": row.get("nightly_price_etb")
                or row.get("daily_price_etb")
                or row.get("price_etb"),
                "destination_id": row.get("destination_id"),
            }
        )
    return summary
