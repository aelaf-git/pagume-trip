import { MOCK_ROOMS, MOCK_PACKAGES, MOCK_VEHICLES, MOCK_GUIDE_PROFILE } from "../constants/mockInventoryData";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

let rooms = clone(MOCK_ROOMS);
let packages = clone(MOCK_PACKAGES);
let vehicles = clone(MOCK_VEHICLES);
let guideProfile = clone(MOCK_GUIDE_PROFILE);

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// Rooms -------------------------------------------------------------
export async function getRooms() {
  await delay(400);
  return clone(rooms);
}

export async function createRoom(data) {
  await delay(500);
  const room = { id: generateId("room"), ...data };
  rooms = [room, ...rooms];
  return clone(room);
}

export async function updateRoom(id, data) {
  await delay(500);
  rooms = rooms.map((room) => (room.id === id ? { ...room, ...data } : room));
  return clone(rooms.find((room) => room.id === id));
}

export async function deleteRoom(id) {
  await delay(400);
  rooms = rooms.filter((room) => room.id !== id);
  return true;
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
