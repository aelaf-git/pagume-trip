function required(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function numberRange(value, { min, max, error }) {
  const num = Number(value);
  if (value === "" || value === null || value === undefined || Number.isNaN(num)) return error;
  if (min !== undefined && num < min) return error;
  if (max !== undefined && num > max) return error;
  return null;
}

export function validateRoom(data) {
  const errors = {};

  if (required(data.roomType)) errors.roomType = "Select a room type.";
  if (required(data.description)) errors.description = "Description is required.";

  const capacityError = numberRange(data.capacity, { min: 1, error: "Capacity must be at least 1." });
  if (capacityError) errors.capacity = capacityError;

  const bedsError = numberRange(data.beds, { min: 1, error: "Beds must be at least 1." });
  if (bedsError) errors.beds = bedsError;

  const priceError = numberRange(data.pricePerNight, { min: 0, error: "Price must be 0 or more." });
  if (priceError) errors.pricePerNight = priceError;

  return errors;
}

export function validatePackage(data) {
  const errors = {};

  if (required(data.name)) errors.name = "Package name is required.";
  if (required(data.destination)) errors.destination = "Select a destination.";
  if (required(data.cancellationPolicy)) errors.cancellationPolicy = "Cancellation policy is required.";

  const durationError = numberRange(data.durationDays, { min: 1, error: "Duration must be at least 1 day." });
  if (durationError) errors.durationDays = durationError;

  const priceError = numberRange(data.price, { min: 0, error: "Price must be 0 or more." });
  if (priceError) errors.price = priceError;

  const minError = numberRange(data.minParticipants, { min: 1, error: "Min participants must be at least 1." });
  if (minError) errors.minParticipants = minError;

  const maxError = numberRange(data.maxParticipants, {
    min: Number(data.minParticipants) || 1,
    error: "Max participants must be at least the minimum.",
  });
  if (maxError) errors.maxParticipants = maxError;

  return errors;
}

export function validateVehicle(data) {
  const errors = {};

  if (required(data.make)) errors.make = "Make is required.";
  if (required(data.model)) errors.model = "Model is required.";
  if (required(data.transmission)) errors.transmission = "Select a transmission.";
  if (required(data.fuelType)) errors.fuelType = "Select a fuel type.";
  if (required(data.driverAvailability)) errors.driverAvailability = "Select driver availability.";

  const yearError = numberRange(data.year, { min: 1950, max: 2030, error: "Enter a valid year (1950–2030)." });
  if (yearError) errors.year = yearError;

  const seatsError = numberRange(data.seats, { min: 1, error: "Seats must be at least 1." });
  if (seatsError) errors.seats = seatsError;

  const dailyError = numberRange(data.dailyPrice, { min: 0, error: "Daily price must be 0 or more." });
  if (dailyError) errors.dailyPrice = dailyError;

  const weeklyError = numberRange(data.weeklyPrice, { min: 0, error: "Weekly price must be 0 or more." });
  if (weeklyError) errors.weeklyPrice = weeklyError;

  const depositError = numberRange(data.deposit, { min: 0, error: "Deposit must be 0 or more." });
  if (depositError) errors.deposit = depositError;

  return errors;
}

export function validateGuide(data) {
  const errors = {};

  if (!data.languages || data.languages.length === 0) {
    errors.languages = "Select at least one language.";
  }

  const guidingError = numberRange(data.guidingDayRate, { min: 0, error: "Rate must be 0 or more." });
  if (guidingError) errors.guidingDayRate = guidingError;

  const drivingError = numberRange(data.drivingDayRate, { min: 0, error: "Rate must be 0 or more." });
  if (drivingError) errors.drivingDayRate = drivingError;

  const invalidRange = (data.availabilityRanges || []).find(
    (range) => !range.startDate || !range.endDate || range.endDate < range.startDate
  );
  if (invalidRange) errors.availabilityRanges = "Each availability range needs a valid start and end date.";

  return errors;
}
