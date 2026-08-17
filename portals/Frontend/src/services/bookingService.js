import {
  CALENDAR_ROOMS,
  CALENDAR_PACKAGES,
  CALENDAR_VEHICLES,
  CALENDAR_GUIDE_RANGES,
  MOCK_BOOKINGS,
  MOCK_ANALYTICS,
} from "../constants/mockBookingData";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let calendarRooms = clone(CALENDAR_ROOMS);
let calendarPackages = clone(CALENDAR_PACKAGES);
let calendarVehicles = clone(CALENDAR_VEHICLES);
let calendarGuideRanges = clone(CALENDAR_GUIDE_RANGES);
let bookings = clone(MOCK_BOOKINGS);
const analytics = clone(MOCK_ANALYTICS);

const CALENDAR_MAP = {
  hotel: () => calendarRooms,
  agency: () => calendarPackages,
  transport: () => calendarVehicles,
  driver: () => calendarGuideRanges,
};

// Availability ------------------------------------------------------
export async function getAvailabilityCalendar(providerType) {
  await delay(400);
  const getter = CALENDAR_MAP[providerType];
  return getter ? getter() : [];
}

export async function toggleAvailability(providerType, itemId, date) {
  await delay(300);
  const getter = CALENDAR_MAP[providerType];
  if (!getter) return null;

  const items = getter();
  const item = items.find((i) => i.id === itemId);
  if (!item || !item.dates) return null;

  const current = item.dates[date];
  if (current === "available") {
    item.dates[date] = "blocked";
  } else if (current === "blocked") {
    item.dates[date] = "available";
  }
  return clone(item);
}

// Bookings ----------------------------------------------------------
export async function getBookings() {
  await delay(400);
  return clone(bookings);
}

export async function confirmBooking(id) {
  await delay(500);
  bookings = bookings.map((b) =>
    b.id === id ? { ...b, bookingStatus: "CONFIRMED", paymentStatus: b.paymentStatus === "UNPAID" ? "PAID" : b.paymentStatus } : b
  );
  return clone(bookings.find((b) => b.id === id));
}

export async function cancelBooking(id) {
  await delay(500);
  bookings = bookings.map((b) => (b.id === id ? { ...b, bookingStatus: "CANCELLED" } : b));
  return clone(bookings.find((b) => b.id === id));
}

// Analytics ---------------------------------------------------------
export async function getAnalytics() {
  await delay(400);
  return clone(analytics);
}
