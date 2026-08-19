import { MOCK_PROFILES } from "../constants/mockProfileData"
// TODO(backend): Replace with `import api from "./api"` (Axios instance)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

/**
 * In-memory profile store, keyed by user ID.
 * Hydrated from localStorage on first access if available.
 * TODO(backend): Remove this in-memory store and localStorage helpers entirely.
 */
let profiles = clone(MOCK_PROFILES)

function readPersisted(userId) {
  // TODO(backend): Remove — backend serves profile from DB
  try {
    const raw = window.localStorage.getItem(`pagume_profile_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writePersisted(userId, data) {
  // TODO(backend): Remove — backend persists to DB
  try {
    window.localStorage.setItem(`pagume_profile_${userId}`, JSON.stringify(data))
  } catch {
    // silent — private browsing or quota exceeded
  }
}

/**
 * Fetch the profile for a given user ID.
 * Returns persisted version if available, otherwise falls back to mock seed.
 * @param {string} userId
 * @returns {Promise<ProviderProfile>}
 */
export async function getProfile(userId) {
  // TODO(backend): Replace with `const { data } = await api.get("/api/providers/profile"); return data.profile;`
  await delay(300)
  const persisted = readPersisted(userId)
  if (persisted) return clone(persisted)
  const mock = profiles[userId]
  if (!mock) return null
  writePersisted(userId, mock)
  return clone(mock)
}

/**
 * Merge partial updates into the profile and persist.
 * @param {string} userId
 * @param {Partial<ProviderProfile>} updates
 * @returns {Promise<ProviderProfile>}
 */
export async function updateProfile(userId, updates) {
  // TODO(backend): Replace with `const { data } = await api.put("/api/providers/profile", updates); return data.profile;`
  await delay(400)
  const existing = profiles[userId]
  if (!existing) throw new Error("Profile not found")

  const merged = {
    ...existing,
    ...updates,
    profileData: {
      ...(existing.profileData || {}),
      ...(updates.profileData || {}),
    },
    documents: {
      ...(existing.documents || {}),
      ...(updates.documents || {}),
    },
    updatedAt: new Date().toISOString(),
  }

  profiles[userId] = merged
  writePersisted(userId, merged)
  return clone(merged)
}

/**
 * Reset a profile back to the original mock seed data.
 * @param {string} userId
 * @returns {Promise<ProviderProfile>}
 */
export async function resetProfile(userId) {
  // TODO(backend): Replace with `const { data } = await api.delete("/api/providers/profile/seed"); return data.profile;`
  // NOTE: This is dev-only — may not exist in production.
  await delay(200)
  const seed = MOCK_PROFILES[userId]
  if (!seed) throw new Error("Profile not found")
  profiles[userId] = clone(seed)
  writePersisted(userId, seed)
  return clone(seed)
}
