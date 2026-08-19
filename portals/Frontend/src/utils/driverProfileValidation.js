function required(value) {
  return value === undefined || value === null || String(value).trim() === ""
}

function numberRange(value, { min, error }) {
  const num = Number(value)
  if (value === "" || value === null || value === undefined || Number.isNaN(num)) return error
  if (min !== undefined && num < min) return error
  return null
}

export function validateDriverProfile(data) {
  const errors = {}
  if (required(data.fullName)) errors.fullName = "Full name is required."
  if (required(data.licenseNumber)) errors.licenseNumber = "License number is required."
  if (required(data.licenseExpiry)) errors.licenseExpiry = "License expiry date is required."
  if (!data.languages || data.languages.length === 0) errors.languages = "Select at least one language."

  const guidingError = numberRange(data.guidingDayRate, { min: 0, error: "Rate must be 0 or more." })
  if (guidingError) errors.guidingDayRate = guidingError

  const drivingError = numberRange(data.drivingDayRate, { min: 0, error: "Rate must be 0 or more." })
  if (drivingError) errors.drivingDayRate = drivingError

  return errors
}
