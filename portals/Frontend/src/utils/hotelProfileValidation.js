const PHONE_PATTERN = /^\+?[0-9]{7,15}$/

export function validateHotelProfile(data) {
  const errors = {}

  if (!data.name || !data.name.trim()) {
    errors.name = "Hotel name is required"
  } else if (data.name.trim().length < 2) {
    errors.name = "Hotel name must be at least 2 characters"
  }

  if (!data.address || !data.address.trim()) {
    errors.address = "Address is required"
  }

  if (data.latitude === undefined || data.latitude === "" || data.latitude === null) {
    errors.latitude = "Latitude is required"
  } else {
    const lat = parseFloat(data.latitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90"
    }
  }

  if (data.longitude === undefined || data.longitude === "" || data.longitude === null) {
    errors.longitude = "Longitude is required"
  } else {
    const lon = parseFloat(data.longitude)
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.longitude = "Longitude must be between -180 and 180"
    }
  }

  if (!data.contact || !data.contact.trim()) {
    errors.contact = "Contact phone is required"
  } else if (!PHONE_PATTERN.test(data.contact.trim())) {
    errors.contact = "Enter a valid phone number (e.g. +251911223344)"
  }

  if (!data.description || !data.description.trim()) {
    errors.description = "Description is required"
  } else if (data.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters"
  }

  if (!data.checkInTime) {
    errors.checkInTime = "Check-in time is required"
  }

  if (!data.checkOutTime) {
    errors.checkOutTime = "Check-out time is required"
  }

  return errors
}
