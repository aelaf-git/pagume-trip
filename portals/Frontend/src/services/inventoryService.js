import { api } from "./api";

function imageUrls(images) {
  return (images ?? [])
    .map((i) => (typeof i === "string" ? i : i?.url))
    .filter(Boolean);
}

function mapRoom(r) {
  return {
    id: r.id,
    hotelId: r.hotel_id,
    roomType: r.room_type,
    description: r.description ?? "",
    capacity: r.capacity,
    beds: r.beds,
    amenities: r.amenities ?? [],
    images: r.images ?? [],
    pricePerNight: r.price_per_night,
    availability: r.is_available,
    availabilityDates: r.availability_dates ?? [],
  };
}

function mapHotel(h) {
  return {
    id: h.id,
    providerId: h.provider_id,
    name: h.name,
    description: h.description ?? "",
    address: h.address ?? "",
    latitude: h.latitude,
    longitude: h.longitude,
    contactDetails: h.contact_details ?? "",
    images: h.images ?? [],
    amenities: h.amenities ?? [],
    policies: h.policies ?? {},
    checkInTime: h.check_in_time ?? "14:00",
    checkOutTime: h.check_out_time ?? "11:00",
    cancellationPolicy: h.cancellation_policy ?? "",
    rooms: (h.rooms ?? []).map(mapRoom),
  };
}

function mapPackage(p) {
  return {
    id: p.id,
    agencyId: p.agency_id,
    name: p.name,
    description: p.description ?? "",
    destination: p.destination ?? "",
    packageType: p.package_type ?? "multi_day",
    durationDays: p.duration_days,
    price: p.price,
    minParticipants: p.min_participants,
    maxParticipants: p.max_participants,
    included: p.included_services ?? [],
    excluded: p.excluded_services ?? [],
    accommodation: p.accommodation ?? "",
    transportation: p.transportation ?? "",
    activities: p.activities ?? [],
    guide: p.guide ?? "",
    images: p.images ?? [],
    availabilityDates: p.availability_dates ?? [],
    cancellationPolicy: p.cancellation_policy ?? "",
  };
}

function mapVehicle(v) {
  return {
    id: v.id,
    rentalCompanyId: v.rental_company_id,
    make: v.make,
    model: v.model,
    year: v.year,
    seats: v.seats,
    transmission: v.transmission,
    fuelType: v.fuel_type,
    fourWheelDrive: v.is_4wd,
    category: v.category ?? "car",
    images: v.images ?? [],
    dailyPrice: v.daily_price,
    weeklyPrice: v.weekly_price,
    deposit: v.deposit,
    insurance: v.insurance_details ?? "",
    driverAvailability: v.driver_available ? "with_driver" : "self_drive",
    pickupLocations: v.pickup_locations ?? [],
    dropoffLocations: v.dropoff_locations ?? [],
    rentalPolicies: v.rental_policies ?? "",
    availabilityDates: v.availability_dates ?? [],
  };
}

function mapDriver(d) {
  return {
    id: d.id,
    userId: d.user_id,
    name: d.name,
    profilePictureUrl: d.profile_picture_url ?? "",
    licenseNumber: d.license_number ?? "",
    licenseExpiry: d.license_expiry ?? "",
    languages: d.languages ?? [],
    experienceLevel: d.experience_level ?? "",
    location: d.location ?? "",
    availabilityRanges: (d.availability_ranges ?? []).map((r) => ({
      id: r.id,
      startDate: r.startDate ?? r.start_date ?? "",
      endDate: r.endDate ?? r.end_date ?? "",
    })),
    providerAssociation: d.provider_association ?? "",
    verificationStatus: d.verification_status,
    documents: d.documents ?? [],
    guidingDayRate: d.guiding_day_rate ?? 0,
    drivingDayRate: d.driving_day_rate ?? 0,
    coverage: d.location ? [d.location] : [],
  };
}

async function ensureHotelId() {
  const hotels = await api.get("/providers/hotels");
  if (hotels.length > 0) return hotels[0].id;
  const created = await api.post("/providers/hotels", {
    name: "My Property",
    description: "",
    address: "",
    images: [],
    amenities: [],
    policies: {},
    check_in_time: "14:00",
    check_out_time: "11:00",
    cancellation_policy: "",
  });
  return created.id;
}

// Hotels / rooms
export async function getHotels() {
  const rows = await api.get("/providers/hotels");
  return rows.map(mapHotel);
}

export async function createHotel(data) {
  const row = await api.post("/providers/hotels", {
    name: data.name,
    description: data.description,
    address: data.address,
    latitude: data.latitude ? Number(data.latitude) : null,
    longitude: data.longitude ? Number(data.longitude) : null,
    contact_details: data.contactDetails,
    images: data.images ?? [],
    amenities: data.amenities ?? [],
    policies: data.policies ?? {},
    check_in_time: data.checkInTime || "14:00",
    check_out_time: data.checkOutTime || "11:00",
    cancellation_policy: data.cancellationPolicy || "",
  });
  return mapHotel(row);
}

export async function updateHotel(id, data) {
  const row = await api.put(`/providers/hotels/${id}`, {
    name: data.name,
    description: data.description,
    address: data.address,
    latitude: data.latitude != null ? Number(data.latitude) : undefined,
    longitude: data.longitude != null ? Number(data.longitude) : undefined,
    contact_details: data.contactDetails,
    images: data.images,
    amenities: data.amenities,
    policies: data.policies,
    check_in_time: data.checkInTime,
    check_out_time: data.checkOutTime,
    cancellation_policy: data.cancellationPolicy,
  });
  return mapHotel(row);
}

export async function getRooms() {
  const hotelId = await ensureHotelId();
  const rows = await api.get(`/providers/hotels/${hotelId}/rooms`);
  return rows.map(mapRoom);
}

export async function createRoom(data) {
  const hotelId = await ensureHotelId();
  const row = await api.post(`/providers/hotels/${hotelId}/rooms`, {
    room_type: data.roomType,
    description: data.description,
    capacity: Number(data.capacity),
    beds: Number(data.beds),
    amenities: data.amenities ?? [],
    images: data.images ?? [],
    price_per_night: Number(data.pricePerNight),
    is_available: data.availability !== false && data.availability !== "unavailable",
    availability_dates: data.availabilityDates ?? [],
  });
  return mapRoom(row);
}

export async function updateRoom(id, data) {
  const row = await api.put(`/providers/rooms/${id}`, {
    room_type: data.roomType,
    description: data.description,
    capacity: data.capacity != null ? Number(data.capacity) : undefined,
    beds: data.beds != null ? Number(data.beds) : undefined,
    amenities: data.amenities,
    images: data.images,
    price_per_night: data.pricePerNight != null ? Number(data.pricePerNight) : undefined,
    is_available:
      data.availability === undefined
        ? undefined
        : data.availability !== false && data.availability !== "unavailable",
    availability_dates: data.availabilityDates,
  });
  return mapRoom(row);
}

export async function deleteRoom(id) {
  await api.del(`/providers/rooms/${id}`);
  return true;
}

// Tours
export async function getPackages() {
  const rows = await api.get("/providers/tours");
  return rows.map(mapPackage);
}

export async function createPackage(data) {
  const row = await api.post("/providers/tours", {
    name: data.name,
    description: data.description,
    destination: data.destination,
    package_type: data.packageType || "multi_day",
    duration_days: data.durationDays ? Number(data.durationDays) : null,
    price: Number(data.price),
    min_participants: data.minParticipants ? Number(data.minParticipants) : null,
    max_participants: data.maxParticipants ? Number(data.maxParticipants) : null,
    included_services: data.included ?? [],
    excluded_services: data.excluded ?? [],
    accommodation: data.accommodation || "",
    transportation: data.transportation || "",
    activities: data.activities ?? [],
    guide: data.guide || "",
    images: imageUrls(data.images),
    availability_dates: data.availabilityDates ?? [],
    cancellation_policy: data.cancellationPolicy || "",
  });
  return mapPackage(row);
}

export async function updatePackage(id, data) {
  const row = await api.put(`/providers/tours/${id}`, {
    name: data.name,
    description: data.description,
    destination: data.destination,
    package_type: data.packageType,
    duration_days: data.durationDays != null ? Number(data.durationDays) : undefined,
    price: data.price != null ? Number(data.price) : undefined,
    min_participants: data.minParticipants != null ? Number(data.minParticipants) : undefined,
    max_participants: data.maxParticipants != null ? Number(data.maxParticipants) : undefined,
    included_services: data.included,
    excluded_services: data.excluded,
    accommodation: data.accommodation,
    transportation: data.transportation,
    activities: data.activities,
    guide: data.guide,
    images: data.images !== undefined ? imageUrls(data.images) : undefined,
    availability_dates: data.availabilityDates,
    cancellation_policy: data.cancellationPolicy,
  });
  return mapPackage(row);
}

export async function deletePackage(id) {
  await api.del(`/providers/tours/${id}`);
  return true;
}

// Vehicles
export async function getVehicles() {
  const rows = await api.get("/providers/vehicles");
  return rows.map(mapVehicle);
}

export async function createVehicle(data) {
  const row = await api.post("/providers/vehicles", {
    make: data.make,
    model: data.model,
    year: data.year ? Number(data.year) : null,
    seats: data.seats ? Number(data.seats) : null,
    transmission: data.transmission || null,
    fuel_type: data.fuelType || null,
    is_4wd: Boolean(data.fourWheelDrive),
    category: data.category || "car",
    images: data.images ?? [],
    daily_price: Number(data.dailyPrice),
    weekly_price: data.weeklyPrice ? Number(data.weeklyPrice) : null,
    deposit: data.deposit != null ? Number(data.deposit) : null,
    insurance_details: data.insurance || "",
    driver_available:
      data.driverAvailability === "with_driver" || data.driverAvailability === true,
    pickup_locations: data.pickupLocations ?? [],
    dropoff_locations: data.dropoffLocations ?? [],
    rental_policies: data.rentalPolicies || "",
    availability_dates: data.availabilityDates ?? [],
  });
  return mapVehicle(row);
}

export async function updateVehicle(id, data) {
  const row = await api.put(`/providers/vehicles/${id}`, {
    make: data.make,
    model: data.model,
    year: data.year != null ? Number(data.year) : undefined,
    seats: data.seats != null ? Number(data.seats) : undefined,
    transmission: data.transmission,
    fuel_type: data.fuelType,
    is_4wd: data.fourWheelDrive,
    category: data.category,
    images: data.images,
    daily_price: data.dailyPrice != null ? Number(data.dailyPrice) : undefined,
    weekly_price: data.weeklyPrice != null ? Number(data.weeklyPrice) : undefined,
    deposit: data.deposit != null ? Number(data.deposit) : undefined,
    insurance_details: data.insurance,
    driver_available:
      data.driverAvailability === undefined
        ? undefined
        : data.driverAvailability === "with_driver" || data.driverAvailability === true,
    pickup_locations: data.pickupLocations,
    dropoff_locations: data.dropoffLocations,
    rental_policies: data.rentalPolicies,
    availability_dates: data.availabilityDates,
  });
  return mapVehicle(row);
}

export async function deleteVehicle(id) {
  await api.del(`/providers/vehicles/${id}`);
  return true;
}

// Driver
export async function getGuideProfile() {
  try {
    const row = await api.get("/providers/driver-profile");
    return mapDriver(row);
  } catch {
    return {
      name: "",
      languages: [],
      coverage: [],
      availabilityRanges: [],
      guidingDayRate: "",
      drivingDayRate: "",
      licenseNumber: "",
      licenseExpiry: "",
      experienceLevel: "",
      location: "",
      verificationStatus: "UNDER_REVIEW",
      documents: [],
    };
  }
}

export async function updateGuideProfile(patch) {
  const row = await api.put("/providers/driver-profile", {
    name: patch.name,
    profile_picture_url: patch.profilePictureUrl,
    license_number: patch.licenseNumber,
    license_expiry: patch.licenseExpiry,
    languages: patch.languages,
    experience_level: patch.experienceLevel,
    location: patch.location || (patch.coverage && patch.coverage[0]) || "",
    availability_ranges: (patch.availabilityRanges ?? []).map((r) => ({
      id: r.id,
      startDate: r.startDate,
      endDate: r.endDate,
    })),
    provider_association: patch.providerAssociation,
    documents: patch.documents,
    guiding_day_rate: patch.guidingDayRate != null ? Number(patch.guidingDayRate) : undefined,
    driving_day_rate: patch.drivingDayRate != null ? Number(patch.drivingDayRate) : undefined,
  });
  return mapDriver(row);
}
