import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import * as marketplaceService from "../../services/marketplaceService";

const EMPTY = {
  q: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  category: "",
  amenities: "",
  providerId: "",
  date: "",
};

function ResultList({ title, items, renderItem }) {
  return (
    <Card title={title}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No results.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function MarketplaceBrowse() {
  const { entity } = useParams();
  const [filters, setFilters] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    destinations: [],
    hotels: [],
    tours: [],
    vehicles: [],
    drivers: [],
  });

  const active = entity || "all";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const f = {
        q: filters.q,
        location: filters.location,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        category: filters.category,
        amenities: filters.amenities,
        providerId: filters.providerId,
        date: filters.date,
      };
      const next = { ...data };
      if (active === "all" || active === "destinations") {
        next.destinations = await marketplaceService.searchDestinations(f);
      }
      if (active === "all" || active === "hotels") {
        next.hotels = await marketplaceService.searchHotels(f);
      }
      if (active === "all" || active === "tours") {
        next.tours = await marketplaceService.searchTours(f);
      }
      if (active === "all" || active === "cars") {
        next.vehicles = await marketplaceService.searchVehicles(f);
      }
      if (active === "all" || active === "drivers") {
        next.drivers = await marketplaceService.searchDrivers(f);
      }
      setData(next);
    } catch (err) {
      setError(err.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  }, [active, filters]);

  useEffect(() => {
    load();
  }, [active]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public browse"
        description="Verified destinations, hotels, tours, cars, and drivers — optional public catalog, not a provider portal."
      />

      <Card title="Filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <Input
            label="Location"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          />
          <Input
            label="Min price"
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
          />
          <Input
            label="Max price"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
          />
          <Input
            label="Category"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          />
          <Input
            label="Amenities"
            value={filters.amenities}
            onChange={(e) => setFilters((f) => ({ ...f, amenities: e.target.value }))}
          />
          <Input
            label="Provider ID"
            value={filters.providerId}
            onChange={(e) => setFilters((f) => ({ ...f, providerId: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="mt-4">
          <Button onClick={load} loading={loading}>
            Apply filters
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </Card>

      {(active === "all" || active === "destinations") && (
        <ResultList
          title="Destinations"
          items={data.destinations}
          renderItem={(d) => (
            <div>
              <p className="font-medium text-gray-900">{d.name}</p>
              <p className="text-gray-500">
                {[d.region, d.zone, d.category].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}
        />
      )}
      {(active === "all" || active === "hotels") && (
        <ResultList
          title="Hotels & resorts"
          items={data.hotels}
          renderItem={(h) => (
            <div>
              <p className="font-medium text-gray-900">{h.name}</p>
              <p className="text-gray-500">{h.address}</p>
            </div>
          )}
        />
      )}
      {(active === "all" || active === "tours") && (
        <ResultList
          title="Tours"
          items={data.tours}
          renderItem={(t) => (
            <div>
              <p className="font-medium text-gray-900">{t.name}</p>
              <p className="text-gray-500">
                {t.destination} · {t.package_type} · {t.price} ETB
              </p>
            </div>
          )}
        />
      )}
      {(active === "all" || active === "cars") && (
        <ResultList
          title="Car rentals"
          items={data.vehicles}
          renderItem={(v) => (
            <div>
              <p className="font-medium text-gray-900">
                {v.make} {v.model}
              </p>
              <p className="text-gray-500">
                {v.category} · {v.daily_price} ETB/day
              </p>
            </div>
          )}
        />
      )}
      {(active === "all" || active === "drivers") && (
        <ResultList
          title="Drivers"
          items={data.drivers}
          renderItem={(d) => (
            <div>
              <p className="font-medium text-gray-900">{d.name}</p>
              <p className="text-gray-500">
                {d.location} · {(d.languages || []).join(", ")}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}
