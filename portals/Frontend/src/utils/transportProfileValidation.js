function required(value) {
  return value === undefined || value === null || String(value).trim() === ""
}

export function validateTransportProfile(data) {
  const errors = {}
  if (required(data.companyName)) errors.companyName = "Company name is required."
  if (required(data.fleetSize)) errors.fleetSize = "Select a fleet size."
  return errors
}
