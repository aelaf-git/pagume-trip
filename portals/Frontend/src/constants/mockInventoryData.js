export function placeholderImage(label, bg = "#0f9d58") {
  const text = encodeURIComponent(label.slice(0, 3).toUpperCase());
  const encodedLabel = encodeURIComponent(label);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">
    <rect width="480" height="320" fill="${bg}"/>
    <text x="240" y="150" font-family="Arial, sans-serif" font-size="64" fill="#ffffff" text-anchor="middle" font-weight="bold">${text}</text>
    <text x="240" y="200" font-family="Arial, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle">${encodedLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}

export const MOCK_ROOMS = [
  {
    id: "room-1",
    roomType: "suite",
    description: "Executive suite with lake-facing balcony, king bed and separate living area.",
    capacity: 3,
    beds: 1,
    amenities: ["Free WiFi", "Air Conditioning", "Room Service", "Airport Shuttle"],
    pricePerNight: 6500,
    availability: true,
  },
  {
    id: "room-2",
    roomType: "double",
    description: "Comfortable double room with city views and en-suite bathroom.",
    capacity: 2,
    beds: 1,
    amenities: ["Free WiFi", "Free Parking", "Restaurant"],
    pricePerNight: 2800,
    availability: true,
  },
  {
    id: "room-3",
    roomType: "family",
    description: "Spacious family room sleeping up to five, with a kid-friendly setup.",
    capacity: 5,
    beds: 2,
    amenities: ["Free WiFi", "Swimming Pool", "Air Conditioning", "Pet Friendly"],
    pricePerNight: 4200,
    availability: false,
  },
];

export const MOCK_PACKAGES = [
  {
    id: "pkg-1",
    name: "Historic Northern Circuit",
    description: "A 7-day journey through Lalibela, Gondar, and the Simien Mountains.",
    destination: "lalibela",
    durationDays: 7,
    price: 48500,
    minParticipants: 2,
    maxParticipants: 10,
    included: ["Hotel accommodation", "4x4 transport", "Professional guide", "Park entrance fees"],
    excluded: ["International flights", "Travel insurance", "Personal expenses", "Tips"],
    activities: [
      { id: "act-1", name: "Rock-hewn churches of Lalibela" },
      { id: "act-2", name: "Gondar castles tour" },
      { id: "act-3", name: "Simien Mountains trekking" },
    ],
    cancellationPolicy: "Free cancellation up to 14 days before departure. 50% fee within 7 days.",
    images: [
      { id: "img-1", name: "Cover photo", url: placeholderImage("Lalibela") },
    ],
  },
  {
    id: "pkg-2",
    name: "Danakil Depression Explorer",
    description: "Camp under the stars at Erta Ale and visit the Dallol sulfur springs.",
    destination: "danakil",
    durationDays: 4,
    price: 32500,
    minParticipants: 4,
    maxParticipants: 12,
    included: ["Camping gear", "Meals", "4x4 transport", "Local guide"],
    excluded: ["Alcoholic drinks", "Sleeping bag", "Tips"],
    activities: [
      { id: "act-1", name: "Erta Ale lava lake" },
      { id: "act-2", name: "Dallol sulfur springs" },
    ],
    cancellationPolicy: "Non-refundable within 7 days of departure.",
    images: [],
  },
  {
    id: "pkg-3",
    name: "Lake Tana & Blue Nile Day Trip",
    description: "Boat trip across Lake Tana and a visit to the Blue Nile Falls.",
    destination: "bahir_dar",
    durationDays: 1,
    price: 6500,
    minParticipants: 1,
    maxParticipants: 8,
    included: ["Boat ride", "Entrance fees", "Lunch"],
    excluded: ["Hotels", "Personal expenses"],
    activities: [{ id: "act-1", name: "Lake Tana island monasteries" }],
    cancellationPolicy: "Free cancellation up to 24 hours before the tour.",
    images: [],
  },
];

export const MOCK_VEHICLES = [
  {
    id: "veh-1",
    make: "Toyota",
    model: "Land Cruiser 4WD",
    year: 2021,
    seats: 6,
    transmission: "automatic",
    fuelType: "diesel",
    fourWheelDrive: true,
    dailyPrice: 9500,
    weeklyPrice: 56000,
    deposit: 20000,
    insurance: "Full comprehensive insurance with a 5000 ETB excess.",
    driverAvailability: "both",
  },
  {
    id: "veh-2",
    make: "Hyundai",
    model: "Tucson",
    year: 2022,
    seats: 5,
    transmission: "manual",
    fuelType: "petrol",
    fourWheelDrive: false,
    dailyPrice: 5200,
    weeklyPrice: 30000,
    deposit: 12000,
    insurance: "Third-party insurance included at no extra cost.",
    driverAvailability: "self_drive",
  },
  {
    id: "veh-3",
    make: "Toyota",
    model: "Hiace Coaster",
    year: 2020,
    seats: 14,
    transmission: "manual",
    fuelType: "diesel",
    fourWheelDrive: false,
    dailyPrice: 12000,
    weeklyPrice: 70000,
    deposit: 25000,
    insurance: "Passenger liability and third-party insurance included.",
    driverAvailability: "with_driver",
  },
];

export const MOCK_GUIDE_PROFILE = {
  fullName: "Dawit Mengistu",
  languages: ["Amharic", "English", "Afaan Oromo"],
  coverage: ["Addis Ababa", "Bahir Dar", "Lalibela"],
  availabilityRanges: [
    { id: "range-1", startDate: "2026-09-01", endDate: "2026-09-20" },
    { id: "range-2", startDate: "2026-11-05", endDate: "2026-11-25" },
  ],
  guidingDayRate: 3500,
  drivingDayRate: 4500,
};
