/** Map backend UserRole ↔ portal path / UI provider type. */

export const ROLE_TO_PORTAL = {
  HOTEL_PROVIDER: "hotel",
  TOUR_AGENCY: "agency",
  CAR_RENTAL: "car-rental",
  DRIVER: "driver",
  GUIDE: "driver",
  ADMIN: "admin",
  TRAVELER: "marketplace",
};

export const PORTAL_TO_ROLE = {
  hotel: "HOTEL_PROVIDER",
  agency: "TOUR_AGENCY",
  "car-rental": "CAR_RENTAL",
  transport: "CAR_RENTAL",
  driver: "DRIVER",
};

export const REGISTER_TYPE_TO_ROLE = {
  hotel: "HOTEL_PROVIDER",
  agency: "TOUR_AGENCY",
  transport: "CAR_RENTAL",
  driver: "DRIVER",
};

export function portalPathForRole(role) {
  const portal = ROLE_TO_PORTAL[role];
  if (portal === "admin") return "/admin/dashboard";
  if (portal === "marketplace") return "/marketplace";
  if (portal) return `/${portal}/dashboard`;
  return "/login";
}

export function normalizeUser(apiUser) {
  const role = apiUser.role;
  return {
    id: apiUser.id,
    name: apiUser.full_name || apiUser.email,
    email: apiUser.email,
    role,
    providerType: ROLE_TO_PORTAL[role] === "car-rental" ? "transport" : ROLE_TO_PORTAL[role],
    isVerified: apiUser.is_verified,
    isActive: apiUser.is_active,
  };
}
