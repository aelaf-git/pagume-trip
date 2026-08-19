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

  if (required(data.name) || String(data.name).trim().length < 2) errors.name = "Room name must be at least 2 characters.";
  if (required(data.roomType)) errors.roomType = "Select a room type.";
  if (required(data.description)) errors.description = "Description is required.";

  const adultError = numberRange(data.adultCapacity, { min: 1, error: "Adult capacity must be at least 1." });
  if (adultError) errors.adultCapacity = adultError;

  const childError = numberRange(data.childCapacity, { min: 0, error: "Child capacity cannot be negative." });
  if (childError) errors.childCapacity = childError;

  const bedsError = numberRange(data.beds, { min: 1, error: "Beds must be at least 1." });
  if (bedsError) errors.beds = bedsError;

  if (required(data.bedConfiguration)) errors.bedConfiguration = "Select a bed configuration.";

  const priceError = numberRange(data.basePrice, { min: 0, error: "Price must be 0 or more." });
  if (priceError) errors.basePrice = priceError;

  const extraError = numberRange(data.extraPersonCharge, { min: 0, error: "Extra person charge must be 0 or more." });
  if (extraError) errors.extraPersonCharge = extraError;

  return errors;
}

export function validatePackage(data) {
  const errors = {};

  if (required(data.name)) errors.name = "Package name is required.";
  if (required(data.destination)) errors.destination = "Select a destination.";
  if (required(data.cancellationPolicy)) errors.cancellationPolicy = "Cancellation policy is required.";
  if (required(data.difficulty)) errors.difficulty = "Select a difficulty level.";

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

  if (!data.departureDates || data.departureDates.length === 0) {
    errors.departureDates = "Add at least one departure date.";
  }

  if (!data.itinerary || data.itinerary.length === 0) {
    errors.itinerary = "Add at least one itinerary day.";
  } else {
    const emptyDay = data.itinerary.find((d) => !d.title || !d.title.trim());
    if (emptyDay) errors.itinerary = "Each itinerary day needs a title.";
  }

  return errors;
}

export function validateVehicle(data) {
  const errors = {};

  if (required(data.make)) errors.make = "Make is required.";
  if (required(data.model)) errors.model = "Model is required.";
  if (required(data.plateNumber)) {
    errors.plateNumber = "Plate number is required.";
  } else if (!/^[A-Za-z]{2,3}-\d{4,5}$/.test(data.plateNumber.trim())) {
    errors.plateNumber = "Use format XXX-1234 (2-3 letters, dash, 4-5 digits).";
  }
  if (required(data.transmission)) errors.transmission = "Select a transmission.";
  if (required(data.fuelType)) errors.fuelType = "Select a fuel type.";
  if (required(data.driverAvailability)) errors.driverAvailability = "Select driver availability.";
  if (required(data.insurance)) errors.insurance = "Select an insurance cover level.";
  if (required(data.status)) errors.status = "Select a vehicle status.";

  const yearError = numberRange(data.year, { min: 1950, max: 2030, error: "Enter a valid year (1950–2030)." });
  if (yearError) errors.year = yearError;

  const seatsError = numberRange(data.seats, { min: 1, error: "Seats must be at least 1." });
  if (seatsError) errors.seats = seatsError;

  const luggageError = numberRange(data.luggageCapacity, { min: 0, error: "Luggage capacity must be 0 or more." });
  if (luggageError) errors.luggageCapacity = luggageError;

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
