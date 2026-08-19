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
    name: "Presidential Suite",
    roomType: "suite",
    description: "Executive suite with lake-facing balcony, king bed and separate living area.",
    adultCapacity: 2,
    childCapacity: 1,
    beds: 1,
    bedConfiguration: "1 King + 1 Sofa Bed",
    amenities: ["Balcony", "AC", "Mini-bar", "Safe", "Ocean View", "Smart TV"],
    basePrice: 8500,
    currency: "ETB",
    extraPersonCharge: 2000,
    availability: true,
  },
  {
    id: "room-2",
    name: "Deluxe Double Room",
    roomType: "double",
    description: "Comfortable double room with city views and en-suite bathroom.",
    adultCapacity: 2,
    childCapacity: 0,
    beds: 1,
    bedConfiguration: "1 Queen",
    amenities: ["AC", "Coffee Maker", "Safe", "City View"],
    basePrice: 3500,
    currency: "ETB",
    extraPersonCharge: 1200,
    availability: true,
  },
  {
    id: "room-3",
    name: "Family Garden Room",
    roomType: "family",
    description: "Spacious family room sleeping up to four, with a kid-friendly setup and garden access.",
    adultCapacity: 2,
    childCapacity: 2,
    beds: 2,
    bedConfiguration: "1 King + 1 Bunk",
    amenities: ["AC", "Coffee Maker", "Bathtub", "Kitchenette"],
    basePrice: 5200,
    currency: "ETB",
    extraPersonCharge: 1500,
    availability: true,
  },
  {
    id: "room-4",
    name: "Standard Single",
    roomType: "single",
    description: "Cozy single room ideal for solo travelers. Clean, quiet, and well-lit.",
    adultCapacity: 1,
    childCapacity: 0,
    beds: 1,
    bedConfiguration: "1 Single",
    amenities: ["AC", "Safe", "Walk-in Shower"],
    basePrice: 1800,
    currency: "ETB",
    extraPersonCharge: 0,
    availability: true,
  },
];

function _dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function _addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const _TODAY = new Date(2026, 7, 18);

function _buildRoomCalendar(rooms) {
  return rooms.map((room) => {
    const dates = {};
    const prices = {};
    for (let i = 0; i < 14; i++) {
      const key = _dateKey(_addDays(_TODAY, i));
      const dow = _addDays(_TODAY, i).getDay();
      const isWeekend = dow === 5 || dow === 6;
      if (room.id === "room-3" && i >= 3 && i <= 5) {
        dates[key] = "blocked";
        prices[key] = null;
      } else if (room.id === "room-1" && (i === 2 || i === 9)) {
        dates[key] = "reserved";
        prices[key] = room.basePrice;
      } else if (room.id === "room-2" && i === 6) {
        dates[key] = "reserved";
        prices[key] = room.basePrice;
      } else {
        dates[key] = "available";
        prices[key] = isWeekend ? Math.round(room.basePrice * 1.25) : room.basePrice;
      }
    }
    return { id: room.id, label: room.name, dates, prices };
  });
}

export const MOCK_ROOM_CALENDAR = _buildRoomCalendar([
  MOCK_ROOMS[0],
  MOCK_ROOMS[1],
  MOCK_ROOMS[2],
  MOCK_ROOMS[3],
]);

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
    status: "active",
    difficulty: "challenging",
    departureDates: ["2026-09-15", "2026-10-01", "2026-10-20"],
    itinerary: [
      { day: 1, title: "Arrival in Lalibela", description: "Airport pickup and transfer to hotel. Evening briefing.", activities: ["Airport transfer", "Hotel check-in"], meals: ["Dinner"] },
      { day: 2, title: "Rock-Hewn Churches", description: "Full day exploring the UNESCO World Heritage rock churches.", activities: ["Visit Bet Medhane Alem", "Visit Bet Giyorgis", "Bet Amanuel"], meals: ["Breakfast", "Lunch", "Dinner"] },
      { day: 3, title: "Transfer to Gondar", description: "Scenic drive through the highlands to Gondar.", activities: ["Scenic drive", "Gondar city orientation"], meals: ["Breakfast", "Lunch", "Dinner"] },
      { day: 4, title: "Gondar Castles", description: "Explore the Royal Enclosure and Debre Berhan Selassie church.", activities: ["Fasil Ghebbi castles", "Debre Berhan Selassie"], meals: ["Breakfast", "Lunch", "Dinner"] },
      { day: 5, title: "Simien Mountains", description: "Drive to Simien Mountains National Park.", activities: ["Park entry", "Short trek to Sankaber"], meals: ["Breakfast", "Lunch", "Dinner"] },
      { day: 6, title: "Trekking Day", description: "Full day trekking with panoramic views.", activities: ["Trek to Geech", "Wildlife spotting"], meals: ["Breakfast", "Lunch", "Dinner"] },
      { day: 7, title: "Departure", description: "Return to Gondar for departure.", activities: ["Morning trek", "Transfer to airport"], meals: ["Breakfast"] },
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
    status: "active",
    difficulty: "difficult",
    departureDates: ["2026-09-20", "2026-10-10"],
    itinerary: [
      { day: 1, title: "Mekelle to Dodom", description: "Drive through the escarpment to Dodom village.", activities: ["Scenic drive", "Arrive at base camp"], meals: ["Lunch", "Dinner"] },
      { day: 2, title: "Erta Ale Night Trek", description: "Night trek to Erta Ale volcano to see the lava lake.", activities: ["Evening trek", "Overnight at crater rim"], meals: ["Dinner"] },
      { day: 3, title: "Dallol Excursion", description: "Visit the otherworldly Dallol sulfur springs.", activities: ["Dallol trek", "Salt flats visit"], meals: ["Breakfast", "Lunch", "Dinner"] },
      { day: 4, title: "Return to Mekelle", description: "Drive back to Mekelle for departure.", activities: ["Morning drive", "Arrive Mekelle"], meals: ["Breakfast", "Lunch"] },
    ],
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
    status: "draft",
    difficulty: "easy",
    departureDates: ["2026-09-25"],
    itinerary: [
      { day: 1, title: "Lake Tana & Blue Nile", description: "Morning boat trip to island monasteries, afternoon visit Blue Nile Falls.", activities: ["Boat to monasteries", "Blue Nile Falls hike"], meals: ["Lunch"] },
    ],
  },
];

export const MOCK_VEHICLES = [
  {
    id: "veh-1",
    make: "Toyota",
    model: "Land Cruiser 4WD",
    year: 2021,
    seats: 6,
    luggageCapacity: 4,
    plateNumber: "ADD-3247",
    transmission: "automatic",
    fuelType: "diesel",
    fourWheelDrive: true,
    dailyPrice: 9500,
    weeklyPrice: 56000,
    deposit: 20000,
    insurance: "premium",
    driverAvailability: "both",
    status: "active",
    features: ["GPS Navigation", "Bluetooth", "USB Charging", "Cruise Control"],
    branchLocation: "Bole International Airport",
    image: placeholderImage("Toyota Land Cruiser", "#2563eb"),
  },
  {
    id: "veh-2",
    make: "Hyundai",
    model: "Tucson",
    year: 2022,
    seats: 5,
    luggageCapacity: 3,
    plateNumber: "AA-18756",
    transmission: "manual",
    fuelType: "petrol",
    fourWheelDrive: false,
    dailyPrice: 5200,
    weeklyPrice: 30000,
    deposit: 12000,
    insurance: "standard",
    driverAvailability: "self_drive",
    status: "active",
    features: ["GPS Navigation", "Bluetooth", "USB Charging"],
    branchLocation: "Piazza",
    image: placeholderImage("Hyundai Tucson", "#059669"),
  },
  {
    id: "veh-3",
    make: "Toyota",
    model: "Hiace Coaster",
    year: 2020,
    seats: 14,
    luggageCapacity: 8,
    plateNumber: "AA-56432",
    transmission: "manual",
    fuelType: "diesel",
    fourWheelDrive: false,
    dailyPrice: 12000,
    weeklyPrice: 70000,
    deposit: 25000,
    insurance: "standard",
    driverAvailability: "with_driver",
    status: "rented",
    features: ["GPS Navigation", "Bluetooth", "Aux Input"],
    branchLocation: "Bole International Airport",
    image: placeholderImage("Toyota Hiace", "#d97706"),
  },
];

export const MOCK_RENTAL_TERMS = {
  lateReturnChargePerHour: 500,
  lateReturnChargePerDay: 3500,
  fuelPolicy: "full_to_full",
  mileagePolicy: "unlimited",
  dailyMileageLimit: null,
  totalMileageLimit: null,
  geographicRestrictions: [
    "Oromia Region — checkpoint clearance required",
    "Somali Region — restricted access, advance approval needed",
  ],
  additionalDriverFee: 1000,
  crossBorderAllowed: false,
  minimumRentalDays: 1,
  maximumRentalDays: 90,
};

export const MOCK_GUIDE_PROFILE = {
  fullName: "Dawit Mengistu",
  bio: "Professional tour guide and driver with over 6 years of experience across Ethiopia. I specialize in cultural and historical tours through the northern circuit and Oromia region. Fluent in four languages, I ensure every guest has a comfortable and informative journey.",
  languages: ["Amharic", "English", "Afaan Oromo"],
  coverage: ["Addis Ababa", "Bahir Dar", "Lalibela"],
  availabilityRanges: [
    { id: "range-1", startDate: "2026-09-01", endDate: "2026-09-20" },
    { id: "range-2", startDate: "2026-11-05", endDate: "2026-11-25" },
  ],
  guidingDayRate: 3500,
  drivingDayRate: 4500,
  airportTransferRate: 2500,
  vehicleType: "Toyota Land Cruiser",
};
