import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "./AuthContext"
import * as profileService from "../services/profileService"

const ProviderProfileContext = createContext(null)

/**
 * @typedef {Object} ProviderProfileContextValue
 * @property {Object|null} profile - The full profile object (profileData, documents, verificationStatus, etc.)
 * @property {boolean} loading - True while the initial profile fetch is in progress
 * @property {boolean} saving - True while a save/update is in progress
 * @property {string|null} error - Error message if the last operation failed
 * @property {boolean} isEditing - Whether the UI is currently in edit mode
 * @property {string|null} notice - Success message to display (auto-clears)
 * @property {(fields: Object) => Promise<Object>} updateProfileData - Merge fields into profile and persist
 * @property {(editing: boolean) => void} setEditing - Toggle edit mode
 * @property {() => Promise<void>} refreshProfile - Reload profile from service
 * @property {() => Promise<void>} resetProfile - Reset to original mock seed data
 */
export function ProviderProfileProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const providerType = user?.providerType

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [notice, setNotice] = useState("")
  const noticeTimer = useRef(null)

  const clearNotice = useCallback(() => {
    clearTimeout(noticeTimer.current)
    noticeTimer.current = null
  }, [])

  const showNotice = useCallback(
    (msg) => {
      setNotice(msg)
      clearNotice()
      noticeTimer.current = setTimeout(() => setNotice(""), 3000)
    },
    [clearNotice]
  )

  useEffect(() => {
    return () => clearNotice()
  }, [clearNotice])

  const loadProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await profileService.getProfile(userId)
      setProfile(data)
    } catch (err) {
      setError(err.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  /**
   * Merge partial updates into the profile and persist.
   * @param {Object} updatedFields - Fields to merge (at top level or nested under profileData/documents)
   * @returns {Promise<Object>} The updated profile
   */
  const updateProfileData = useCallback(
    async (updatedFields) => {
      if (!userId) throw new Error("No user logged in")
      setSaving(true)
      setError(null)
      try {
        const updated = await profileService.updateProfile(userId, updatedFields)
        setProfile(updated)
        setIsEditing(false)
        showNotice("Profile updated successfully")
        return updated
      } catch (err) {
        setError(err.message || "Failed to update profile")
        throw err
      } finally {
        setSaving(false)
      }
    },
    [userId, showNotice]
  )

  const refreshProfile = useCallback(async () => {
    await loadProfile()
  }, [loadProfile])

  const resetProfile = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await profileService.resetProfile(userId)
      setProfile(data)
      setIsEditing(false)
      showNotice("Profile reset to original data")
    } catch (err) {
      setError(err.message || "Failed to reset profile")
    } finally {
      setLoading(false)
    }
  }, [userId, showNotice])

  const value = {
    profile,
    providerType,
    loading,
    saving,
    error,
    isEditing,
    notice,
    updateProfileData,
    setEditing: setIsEditing,
    refreshProfile,
    resetProfile,
  }

  return (
    <ProviderProfileContext.Provider value={value}>
      {children}
    </ProviderProfileContext.Provider>
  )
}

/**
 * Access the full provider profile context.
 * Must be used inside a <ProviderProfileProvider>.
 */
export function useProviderProfile() {
  const ctx = useContext(ProviderProfileContext)
  if (!ctx) throw new Error("useProviderProfile must be used within a ProviderProfileProvider")
  return ctx
}

/**
 * Convenience hook that extracts commonly needed profile fields.
 * Returns the same shape as the profile's profileData plus metadata.
 */
export function useProfileFields() {
  const { profile, providerType } = useProviderProfile()
  return {
    profileData: profile?.profileData || {},
    documents: profile?.documents || {},
    verificationStatus: profile?.verificationStatus || null,
    providerType,
    submittedAt: profile?.submittedAt || null,
    updatedAt: profile?.updatedAt || null,
  }
}
