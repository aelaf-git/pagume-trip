import { MOCK_PROVIDERS } from "../constants/mockVerificationData"

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

let providers = clone(MOCK_PROVIDERS)

export async function getProviders() {
  await delay(300)
  return clone(providers)
}

export async function getProvider(id) {
  await delay(200)
  return clone(providers.find((p) => p.id === id) || null)
}

export async function approveProvider(id) {
  await delay(400)
  const idx = providers.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error("Provider not found")
  providers[idx].status = "VERIFIED"
  providers[idx].statusNote = "Verified by admin."
  providers[idx].rejectionReason = null
  return clone(providers[idx])
}

export async function rejectProvider(id, reason) {
  await delay(400)
  const idx = providers.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error("Provider not found")
  providers[idx].status = "REJECTED"
  providers[idx].rejectionReason = reason
  providers[idx].statusNote = null
  return clone(providers[idx])
}

export async function requestDocuments(id, reason) {
  await delay(400)
  const idx = providers.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error("Provider not found")
  providers[idx].status = "UNDER_REVIEW"
  providers[idx].statusNote = reason || "Additional documents requested."
  providers[idx].rejectionReason = null
  return clone(providers[idx])
}

export async function suspendProvider(id, reason) {
  await delay(400)
  const idx = providers.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error("Provider not found")
  providers[idx].status = "SUSPENDED"
  providers[idx].statusNote = reason
  providers[idx].rejectionReason = null
  return clone(providers[idx])
}
