function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

const TODAY = new Date(2026, 7, 18);

function buildDateMap(statuses) {
  const map = {};
  let day = 0;
  for (const [status, count] of statuses) {
    for (let i = 0; i < count; i++) {
      map[dateKey(addDays(TODAY, day))] = status;
      day++;
    }
  }
  return map;
}

export const CALENDAR_ROOMS = [
  {
    id: "room-1",
    label: "Suite 101",
    dates: buildDateMap([["available", 3], ["reserved", 2], ["available", 2], ["blocked", 1], ["available", 5], ["reserved", 1]]),
  },
  {
    id: "room-2",
    label: "Double 201",
    dates: buildDateMap([["available", 5], ["blocked", 2], ["available", 4], ["reserved", 2], ["available", 1]]),
  },
  {
    id: "room-3",
    label: "Family 301",
    dates: buildDateMap([["reserved", 3], ["available", 2], ["blocked", 4], ["available", 4], ["reserved", 1]]),
  },
];

export const CALENDAR_PACKAGES = [
  {
    id: "pkg-1",
    label: "Northern Circuit",
    dates: buildDateMap([["available", 2], ["reserved", 3], ["available", 2], ["reserved", 2], ["available", 5]]),
    seatsAvailable: { default: 10 },
  },
  {
    id: "pkg-2",
    label: "Danakil Explorer",
    dates: buildDateMap([["available", 4], ["blocked", 2], ["available", 3], ["reserved", 2], ["available", 3]]),
    seatsAvailable: { default: 12 },
  },
  {
    id: "pkg-3",
    label: "Lake Tana Day Trip",
    dates: buildDateMap([["available", 7], ["reserved", 1], ["available", 5], ["blocked", 1], ["available", 2]]),
    seatsAvailable: { default: 8 },
  },
];

export const CALENDAR_VEHICLES = [
  {
    id: "veh-1",
    label: "Toyota Land Cruiser",
    dates: buildDateMap([["available", 2], ["reserved", 3], ["available", 1], ["blocked", 2], ["available", 4], ["reserved", 1], ["available", 3]]),
  },
  {
    id: "veh-2",
    label: "Hyundai Tucson",
    dates: buildDateMap([["reserved", 2], ["available", 5], ["blocked", 1], ["available", 3], ["reserved", 2], ["available", 3]]),
  },
  {
    id: "veh-3",
    label: "Hiace Coaster",
    dates: buildDateMap([["available", 3], ["reserved", 1], ["available", 4], ["reserved", 2], ["available", 2], ["blocked", 1], ["available", 3]]),
  },
];

export const CALENDAR_GUIDE_RANGES = [
  { id: "range-1", startDate: "2026-09-01", endDate: "2026-09-20" },
  { id: "range-2", startDate: "2026-11-05", endDate: "2026-11-25" },
];

export const MOCK_BOOKINGS = [
  {
    id: "BK-1001",
    serviceName: "Suite 101",
    dates: "Sep 12 – Sep 15",
    price: 19500,
    customerName: "Abebe Kebede",
    paymentStatus: "PAID",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "BK-1002",
    serviceName: "Northern Circuit",
    dates: "Oct 1 – Oct 7",
    price: 97000,
    customerName: "Sarah Mitchell",
    paymentStatus: "PARTIAL",
    bookingStatus: "PENDING",
  },
  {
    id: "BK-1003",
    serviceName: "Toyota Land Cruiser",
    dates: "Aug 20 – Aug 23",
    price: 28500,
    customerName: "Daniel Tadesse",
    paymentStatus: "PAID",
    bookingStatus: "COMPLETED",
  },
  {
    id: "BK-1004",
    serviceName: "Lake Tana Day Trip",
    dates: "Sep 8",
    price: 6500,
    customerName: "Fatima Hassan",
    paymentStatus: "UNPAID",
    bookingStatus: "PENDING",
  },
  {
    id: "BK-1005",
    serviceName: "Double 201",
    dates: "Sep 5 – Sep 7",
    price: 8400,
    customerName: "Li Wei Chen",
    paymentStatus: "PAID",
    bookingStatus: "CONFIRMED",
  },
  {
    id: "BK-1006",
    serviceName: "Danakil Explorer",
    dates: "Nov 10 – Nov 13",
    price: 65000,
    customerName: "James O'Connor",
    paymentStatus: "PAID",
    bookingStatus: "AUTHORIZED",
  },
  {
    id: "BK-1007",
    serviceName: "Hyundai Tucson",
    dates: "Aug 22 – Aug 25",
    price: 15600,
    customerName: "Hana Gebru",
    paymentStatus: "REFUNDED",
    bookingStatus: "CANCELLED",
  },
  {
    id: "BK-1008",
    serviceName: "Suite 101",
    dates: "Jul 28 – Jul 30",
    price: 13000,
    customerName: "Mohammed Ali",
    paymentStatus: "PAID",
    bookingStatus: "COMPLETED",
  },
  {
    id: "BK-1009",
    serviceName: "Northern Circuit",
    dates: "Dec 15 – Dec 21",
    price: 97000,
    customerName: "Yuki Tanaka",
    paymentStatus: "UNPAID",
    bookingStatus: "DRAFT",
  },
  {
    id: "BK-1010",
    serviceName: "Family 301",
    dates: "Sep 20 – Sep 22",
    price: 12600,
    customerName: "Ruth Abera",
    paymentStatus: "PARTIAL",
    bookingStatus: "PENDING",
  },
];

export const MOCK_ANALYTICS = {
  metrics: [
    { key: "profileViews", label: "Profile Views", value: 1243, trend: "+12%", trendUp: true },
    { key: "searchAppearances", label: "Search Appearances", value: 3891, trend: "+8%", trendUp: true },
    { key: "aiRecommendations", label: "AI Recommendation Views", value: 728, trend: "+34%", trendUp: true, highlight: true },
    { key: "revenue", label: "Revenue", value: 342500, prefix: "ETB ", trend: "+19%", trendUp: true },
    { key: "bookingRequests", label: "Booking Requests", value: 67, trend: "-3%", trendUp: false },
    { key: "conversionRate", label: "Conversion Rate", value: 18.4, suffix: "%", trend: "+2.1pp", trendUp: true },
  ],
  monthlyRevenue: [
    { label: "Apr", value: 45000 },
    { label: "May", value: 62000 },
    { label: "Jun", value: 78000 },
    { label: "Jul", value: 55000 },
    { label: "Aug", value: 48000 },
    { label: "Sep", value: 54500 },
  ],
  monthlyBookings: [
    { label: "Apr", value: 9 },
    { label: "May", value: 12 },
    { label: "Jun", value: 15 },
    { label: "Jul", value: 11 },
    { label: "Aug", value: 8 },
    { label: "Sep", value: 12 },
  ],
};
