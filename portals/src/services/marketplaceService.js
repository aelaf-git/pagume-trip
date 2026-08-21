import { api } from "./api";

function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function searchDestinations(filters = {}) {
  return api.get(`/public/destinations${qs({ q: filters.q, location: filters.location, category: filters.category })}`);
}

export async function searchHotels(filters = {}) {
  return api.get(
    `/public/hotels${qs({
      q: filters.q,
      location: filters.location,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      amenities: filters.amenities,
      provider_id: filters.providerId,
      date: filters.date,
    })}`
  );
}

export async function searchTours(filters = {}) {
  return api.get(
    `/public/tours${qs({
      q: filters.q,
      location: filters.location,
      destination: filters.destination,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      category: filters.category,
      provider_id: filters.providerId,
      date: filters.date,
    })}`
  );
}

export async function searchVehicles(filters = {}) {
  return api.get(
    `/public/vehicles${qs({
      q: filters.q,
      location: filters.location,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      category: filters.category,
      provider_id: filters.providerId,
      date: filters.date,
    })}`
  );
}

export async function searchDrivers(filters = {}) {
  return api.get(
    `/public/drivers${qs({
      q: filters.q,
      location: filters.location,
      provider_id: filters.providerId,
      date: filters.date,
    })}`
  );
}
