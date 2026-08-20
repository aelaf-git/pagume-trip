import {
  CALENDAR_ROOMS,
  CALENDAR_PACKAGES,
  CALENDAR_VEHICLES,
  CALENDAR_GUIDE_RANGES,
  MOCK_BOOKINGS,
  MOCK_ANALYTICS,
  MOCK_DRIVER_CALENDAR,
  MOCK_DRIVER_ASSIGNMENTS,
} from "../constants/mockBookingData"
// TODO(backend): Replace with `import api from "./api"` (Axios instance)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// TODO(backend): Remove all in-memory stores and MOCK_* imports — backend serves from DB
let calendarRooms = clone(CALENDAR_ROOMS)
let calendarPackages = clone(CALENDAR_PACKAGES)
let calendarVehicles = clone(CALENDAR_VEHICLES)
let calendarGuideRanges = clone(CALENDAR_GUIDE_RANGES)
let bookings = clone(MOCK_BOOKINGS)
let driverCalendar = clone(MOCK_DRIVER_CALENDAR)
let driverAssignments = clone(MOCK_DRIVER_ASSIGNMENTS)
const analytics = clone(MOCK_ANALYTICS)

const CALENDAR_MAP = {
  hotel: () => calendarRooms,
  agency: () => calendarPackages,
  transport: () => calendarVehicles,
  driver: () => calendarGuideRanges,
};

// Availability ------------------------------------------------------
// TODO(backend): Replace with Axios calls to /api/providers/bookings/availability
export async function getAvailabilityCalendar(providerType) {
  // TODO(backend): const { data } = await api.get(`/api/providers/bookings/availability?type=${providerType}`); return data.entries;
  await delay(400)
  const getter = CALENDAR_MAP[providerType]
  return getter ? getter() : []
}

export async function toggleAvailability(providerType, itemId, date) {
  // TODO(backend): const { data } = await api.patch("/api/providers/bookings/availability/toggle", { providerType, itemId, date }); return data.entry;
  await delay(300)
  const getter = CALENDAR_MAP[providerType]
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
// TODO(backend): Replace with Axios calls to /api/providers/bookings
export async function getBookings() {
  // TODO(backend): const { data } = await api.get("/api/providers/bookings"); return data.bookings;
  await delay(400)
  return clone(bookings)
}

export async function confirmBooking(id) {
  // TODO(backend): const { data } = await api.patch(`/api/providers/bookings/${id}/confirm`); return data.booking;
  await delay(500)
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
// TODO(backend): Replace with Axios call to /api/providers/bookings/analytics
export async function getAnalytics() {
  // TODO(backend): const { data } = await api.get("/api/providers/bookings/analytics"); return data.analytics;
  await delay(400)
  return clone(analytics)
}

// Driver calendar ----------------------------------------------------
// TODO(backend): Replace with Axios calls to /api/providers/driver/calendar
export async function getDriverCalendar(year, month) {
  // TODO(backend): const { data } = await api.get(`/api/providers/driver/calendar?year=${year}&month=${month}`); return data.events;
  await delay(400)
  if (year === undefined || month === undefined) return clone(driverCalendar);
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return clone(driverCalendar.filter((e) => e.date.startsWith(prefix)));
}

export async function toggleDriverDate(date, type) {
  await delay(300);
  const existing = driverCalendar.find((e) => e.date === date);
  if (existing) {
    if (existing.type === type) {
      driverCalendar = driverCalendar.filter((e) => e.date !== date);
    } else {
      existing.type = type;
      if (type === "off") existing.label = "Personal Leave";
    }
  } else {
    driverCalendar.push({ date, type, label: type === "off" ? "Personal Leave" : "" });
  }
  return clone(driverCalendar);
}

// Driver assignments -------------------------------------------------
// TODO(backend): Replace with Axios calls to /api/providers/driver/assignments
export async function getDriverAssignments() {
  // TODO(backend): const { data } = await api.get("/api/providers/driver/assignments"); return data.assignments;
  await delay(400)
  return clone(driverAssignments)
}

export async function togglePrepStep(assignmentId, stepIndex) {
  // TODO(backend): const { data } = await api.patch(`/api/providers/driver/assignments/${assignmentId}/prep/${stepIndex}/toggle`); return data.assignment;
  await delay(200)
  const assignment = driverAssignments.find((a) => a.id === assignmentId);
  if (assignment && assignment.preparation[stepIndex] !== undefined) {
    assignment.preparation[stepIndex].done = !assignment.preparation[stepIndex].done;
  }
  return clone(assignment);
}

export async function addPrepStep(assignmentId, stepText) {
  await delay(200);
  const assignment = driverAssignments.find((a) => a.id === assignmentId);
  if (assignment) {
    assignment.preparation.push({ step: stepText, done: false });
  }
  return clone(assignment);
}
