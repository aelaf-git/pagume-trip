import { MOCK_DESTINATIONS } from "../constants/mockDestinationData"

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

let destinations = clone(MOCK_DESTINATIONS)

const generateId = () => `dst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export async function getDestinations() {
  await delay(300)
  return clone(destinations)
}

export async function createDestination(data) {
  await delay(400)
  const dest = { id: generateId(), ...data, createdAt: new Date().toISOString() }
  destinations = [dest, ...destinations]
  return clone(dest)
}

export async function updateDestination(id, data) {
  await delay(400)
  destinations = destinations.map((d) => (d.id === id ? { ...d, ...data } : d))
  return clone(destinations.find((d) => d.id === id))
}

export async function deleteDestination(id) {
  await delay(300)
  destinations = destinations.filter((d) => d.id !== id)
  return true
}

export async function importDestinations(items) {
  await delay(600)
  const imported = items.map((item) => ({
    id: generateId(),
    ...item,
    createdAt: new Date().toISOString(),
  }))
  destinations = [...imported, ...destinations]
  return { imported: imported.length, total: destinations.length }
}
