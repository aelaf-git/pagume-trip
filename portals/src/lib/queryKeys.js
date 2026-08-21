export const queryKeys = {
  hotels: ["provider", "hotels"],
  rooms: ["provider", "rooms"],
  tours: ["provider", "tours"],
  vehicles: ["provider", "vehicles"],
  bookings: ["provider", "bookings"],
  notifications: ["provider", "notifications"],
  profile: ["provider", "profile"],
  adminActivities: ["admin", "activities"],
  adminDashboardStats: ["admin", "dashboard", "stats"],
};

export const STALE_HOTEL_MS = 60_000;
export const STALE_ROOMS_MS = 60_000;
export const STALE_TOURS_MS = 60_000;
export const STALE_VEHICLES_MS = 60_000;
export const STALE_PROFILE_MS = 60_000;
export const STALE_BOOKINGS_MS = 15_000;
export const STALE_NOTIFICATIONS_MS = 15_000;
export const STALE_ADMIN_MS = 15_000;
