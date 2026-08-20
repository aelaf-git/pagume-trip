export const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

export const DRIVER_AVAILABILITY_OPTIONS = [
  { value: "self_drive", label: "Self-drive only" },
  { value: "with_driver", label: "With driver only" },
  { value: "both", label: "Self-drive & with driver" },
];

export const ROOM_AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
];

export const DESTINATIONS = [
  { value: "addis_ababa", label: "Addis Ababa" },
  { value: "lalibela", label: "Lalibela" },
  { value: "gondar", label: "Gondar" },
  { value: "bahir_dar", label: "Bahir Dar" },
  { value: "axum", label: "Axum" },
  { value: "hawassa", label: "Hawassa" },
  { value: "arba_minch", label: "Arba Minch" },
  { value: "jinka", label: "Jinka" },
  { value: "dire_dawa", label: "Dire Dawa" },
  { value: "danakil", label: "Danakil Depression" },
  { value: "bale", label: "Bale Mountains" },
  { value: "simien", label: "Simien Mountains" },
];

export const COVERAGE_AREAS = [
  "Addis Ababa",
  "Bahir Dar",
  "Lalibela",
  "Gondar",
  "Axum",
  "Hawassa",
  "Arba Minch",
  "Jinka",
  "Dire Dawa",
  "Simien Mountains",
];

export const DESTINATION_LABELS = Object.fromEntries(
  DESTINATIONS.map(({ value, label }) => [value, label])
);

export const BED_CONFIGURATION_OPTIONS = [
  { value: "1 Single", label: "1 Single" },
  { value: "1 Double", label: "1 Double" },
  { value: "1 Queen", label: "1 Queen" },
  { value: "1 King", label: "1 King" },
  { value: "2 Singles", label: "2 Singles" },
  { value: "2 Doubles", label: "2 Doubles" },
  { value: "1 King + 1 Sofa Bed", label: "1 King + 1 Sofa Bed" },
  { value: "1 King + 1 Bunk", label: "1 King + 1 Bunk" },
  { value: "2 Queens", label: "2 Queens" },
  { value: "Custom", label: "Custom" },
];

export const CURRENCY_OPTIONS = [
  { value: "ETB", label: "ETB (Birr)" },
  { value: "USD", label: "USD ($)" },
];

export const ROOM_SPECIFIC_AMENITIES = [
  "Balcony",
  "AC",
  "Mini-bar",
  "Safe",
  "Coffee Maker",
  "Iron & Board",
  "Ocean View",
  "City View",
  "Bathtub",
  "Walk-in Shower",
  "Kitchenette",
  "Smart TV",
];

export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "challenging", label: "Challenging" },
  { value: "difficult", label: "Difficult" },
];

export const PACKAGE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

export const PACKAGE_STATUS_TONES = {
  draft: "gray",
  active: "green",
  paused: "amber",
};

export const INCLUSION_OPTIONS = [
  "Airport Transfers",
  "Accommodation",
  "Meals (Breakfast)",
  "Meals (Full Board)",
  "Transportation",
  "Professional Guide",
  "Entrance Fees",
  "Travel Insurance",
  "Visa Assistance",
  "Equipment Rental",
  "WiFi",
  "Tips & Gratuities",
];

export const EXCLUSION_OPTIONS = [
  "International Flights",
  "Domestic Flights",
  "Travel Insurance",
  "Personal Expenses",
  "Alcoholic Drinks",
  "Laundry",
  "Phone Calls",
  "Optional Activities",
  "Tips & Gratuities",
];

export const VEHICLE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "rented", label: "Rented Out" },
  { value: "maintenance", label: "Under Maintenance" },
];

export const VEHICLE_STATUS_TONES = {
  active: "green",
  rented: "amber",
  maintenance: "gray",
};

export const FUEL_POLICY_OPTIONS = [
  { value: "full_to_full", label: "Full to Full" },
  { value: "same_level", label: "Same Level" },
  { value: "prepaid", label: "Prepaid Fuel" },
];

export const MILEAGE_OPTIONS = [
  { value: "unlimited", label: "Unlimited" },
  { value: "daily_limit", label: "Daily Limit" },
  { value: "total_limit", label: "Total Trip Limit" },
];

export const INSURANCE_COVER_OPTIONS = [
  { value: "basic", label: "Basic (Third-party only)" },
  { value: "standard", label: "Standard (Third-party + Collision)" },
  { value: "premium", label: "Premium (Full comprehensive)" },
  { value: "zero_excess", label: "Zero Excess (No deductible)" },
];

export const VEHICLE_SPECIFIC_FEATURES = [
  "GPS Navigation",
  "Child Seat",
  "Bluetooth",
  "USB Charging",
  "Roof Rack",
  "Baby Carrier",
  "Wheelchair Accessible",
  "Dashcam",
  "Aux Input",
  "Sunroof",
  "Heated Seats",
  "Cruise Control",
];

export const DRIVER_CALENDAR_EVENT_TYPES = {
  booked: { label: "Booked", color: "bg-blue-100 text-blue-700 border-blue-300" },
  off: { label: "Day Off", color: "bg-gray-100 text-gray-500 border-gray-300" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-600 border-red-300" },
  available: { label: "Available", color: "bg-green-50 text-green-600 border-green-200" },
};

export const PREPARATION_STEP_OPTIONS = [
  "Confirm hotel bookings",
  "Arrange vehicle inspection",
  "Print itinerary copies",
  "Contact client for pickup time",
  "Stock water and snacks",
  "Check first-aid kit",
  "Verify park entrance fees paid",
  "Charge phone and backup battery",
];

export const VERIFICATION_DOC_STATUS = {
  APPROVED: { label: "Approved", tone: "green" },
  PENDING: { label: "Pending Review", tone: "amber" },
  EXPIRED: { label: "Expired", tone: "red" },
};
