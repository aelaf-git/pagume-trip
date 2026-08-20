import { MOCK_ROOMS, MOCK_PACKAGES, MOCK_VEHICLES, MOCK_GUIDE_PROFILE, MOCK_ROOM_CALENDAR, MOCK_RENTAL_TERMS } from "../constants/mockInventoryData"
// TODO(backend): Replace with `import api from "./api"` (Axios instance)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// TODO(backend): Remove all in-memory stores and MOCK_* imports — backend serves from DB
let rooms = clone(MOCK_ROOMS)
let packages = clone(MOCK_PACKAGES)
let vehicles = clone(MOCK_VEHICLES)
let guideProfile = clone(MOCK_GUIDE_PROFILE)
let roomCalendar = clone(MOCK_ROOM_CALENDAR)
let rentalTerms = clone(MOCK_RENTAL_TERMS)

// TODO(backend): Remove — backend generates IDs
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// Rooms -------------------------------------------------------------
// TODO(backend): Replace each function body with Axios calls to /api/providers/inventory/rooms
export async function getRooms() {
  // TODO(backend): const { data } = await api.get("/api/providers/inventory/rooms"); return data.rooms;
  await delay(400)
  return clone(rooms)
}

export async function createRoom(data) {
  // TODO(backend): const { data: res } = await api.post("/api/providers/inventory/rooms", data); return res.room;
  await delay(500)
  const room = { id: generateId("room"), ...data }
  rooms = [room, ...rooms]
  return clone(room)
}

export async function updateRoom(id, data) {
  // TODO(backend): const { data: res } = await api.put(`/api/providers/inventory/rooms/${id}`, data); return res.room;
  await delay(500)
  rooms = rooms.map((room) => (room.id === id ? { ...room, ...data } : room))
  return clone(rooms.find((room) => room.id === id))
}

export async function deleteRoom(id) {
  // TODO(backend): await api.delete(`/api/providers/inventory/rooms/${id}`); return true;
  await delay(400)
  rooms = rooms.filter((room) => room.id !== id)
  return true
}

// Packages ----------------------------------------------------------
export async function getPackages() {
  await delay(400);
  return clone(packages);
}

export async function createPackage(data) {
  await delay(500);
  const pkg = { id: generateId("pkg"), ...data };
  packages = [pkg, ...packages];
  return clone(pkg);
}

export async function updatePackage(id, data) {
  await delay(500);
  packages = packages.map((pkg) => (pkg.id === id ? { ...pkg, ...data } : pkg));
  return clone(packages.find((pkg) => pkg.id === id));
}

export async function deletePackage(id) {
  await delay(400);
  packages = packages.filter((pkg) => pkg.id !== id);
  return true;
}

export async function clonePackage(id) {
  await delay(400);
  const original = packages.find((pkg) => pkg.id === id);
  if (!original) throw new Error("Package not found");
  const cloned = {
    ...clone(original),
    id: generateId("pkg"),
    name: `${original.name} (Copy)`,
    status: "draft",
  };
  packages = [cloned, ...packages];
  return clone(cloned);
}

export async function togglePackageStatus(id) {
  await delay(300);
  const pkg = packages.find((p) => p.id === id);
  if (!pkg) return null;
  pkg.status = pkg.status === "active" ? "paused" : "active";
  return clone(pkg);
}

// Vehicles ----------------------------------------------------------
export async function getVehicles() {
  await delay(400);
  return clone(vehicles);
}

export async function createVehicle(data) {
  await delay(500);
  const vehicle = { id: generateId("veh"), ...data };
  vehicles = [vehicle, ...vehicles];
  return clone(vehicle);
}

export async function updateVehicle(id, data) {
  await delay(500);
  vehicles = vehicles.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...data } : vehicle));
  return clone(vehicles.find((vehicle) => vehicle.id === id));
}

export async function deleteVehicle(id) {
  await delay(400);
  vehicles = vehicles.filter((vehicle) => vehicle.id !== id);
  return true;
}

// Rental terms -------------------------------------------------------
export async function getRentalTerms() {
  await delay(300);
  return clone(rentalTerms);
}

export async function updateRentalTerms(data) {
  await delay(500);
  rentalTerms = { ...rentalTerms, ...data };
  return clone(rentalTerms);
}

// Guide profile -----------------------------------------------------
export async function getGuideProfile() {
  await delay(400);
  return clone(guideProfile);
}

export async function updateGuideProfile(patch) {
  await delay(500);
  guideProfile = { ...guideProfile, ...patch };
  return clone(guideProfile);
}

// Room calendar -----------------------------------------------------
export async function getRoomCalendar() {
  await delay(400);
  return clone(roomCalendar);
}

export async function toggleRoomDate(roomId, date) {
  await delay(300);
  const entry = roomCalendar.find((r) => r.id === roomId);
  if (!entry || !entry.dates) return null;
  const current = entry.dates[date];
  if (current === "available") {
    entry.dates[date] = "blocked";
    entry.prices[date] = null;
  } else if (current === "blocked") {
    entry.dates[date] = "available";
    const room = rooms.find((r) => r.id === roomId);
    entry.prices[date] = room ? room.basePrice : 0;
  }
  return clone(entry);
}

export async function bulkAdjustPrices(roomIds, startDate, endDate, adjustment) {
  await delay(500);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = [];
  for (const entry of roomCalendar) {
    if (!roomIds.includes(entry.id)) continue;
    const room = rooms.find((r) => r.id === entry.id);
    const base = room ? room.basePrice : 0;
    const d = new Date(start);
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      if (entry.dates[key] === "available") {
        const currentPrice = entry.prices[key] ?? base;
        let newPrice;
        if (adjustment.type === "percentage") {
          newPrice = Math.round(currentPrice * (1 + adjustment.value / 100));
        } else {
          newPrice = currentPrice + adjustment.value;
        }
        entry.prices[key] = Math.max(0, newPrice);
      }
      d.setDate(d.getDate() + 1);
    }
    result.push(clone(entry));
  }
  return result;
}
