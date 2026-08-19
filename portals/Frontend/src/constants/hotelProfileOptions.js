export const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible — Full refund up to 24 hours before check-in" },
  { value: "moderate", label: "Moderate — Full refund up to 48 hours before check-in" },
  { value: "strict", label: "Strict — 50% refund up to 7 days before check-in" },
  { value: "non_refundable", label: "Non-refundable — No refund" },
]

export const PET_POLICIES = [
  { value: "allowed", label: "Pets allowed" },
  { value: "small_only", label: "Small pets only (under 10 kg)" },
  { value: "not_allowed", label: "No pets allowed" },
]

export const SMOKING_POLICIES = [
  { value: "allowed", label: "Smoking allowed" },
  { value: "designated", label: "Designated smoking areas only" },
  { value: "not_allowed", label: "No smoking on premises" },
]

export const EXTENDED_AMENITIES = [
  "Free WiFi",
  "Swimming Pool",
  "Free Parking",
  "Restaurant",
  "Fitness Center",
  "Spa",
  "Air Conditioning",
  "Pet Friendly",
  "Airport Shuttle",
  "Room Service",
  "Business Center",
  "Conference Rooms",
  "Laundry Service",
  "Bar / Lounge",
  "Rooftop Terrace",
  "Garden / Courtyard",
  "24-Hour Front Desk",
  "Concierge Service",
  "Elevator",
  "Wheelchair Accessible",
]

export function placeholderImage(label, bg = "#0f9d58") {
  const text = encodeURIComponent(label.slice(0, 3).toUpperCase())
  const encodedLabel = encodeURIComponent(label)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">
    <rect width="480" height="320" fill="${bg}"/>
    <text x="240" y="150" font-family="Arial, sans-serif" font-size="64" fill="#ffffff" text-anchor="middle" font-weight="bold">${text}</text>
    <text x="240" y="200" font-family="Arial, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle">${encodedLabel}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${svg}`
}

export const MOCK_HOTEL_MEDIA = [
  { id: "media-1", name: "Hotel Lobby", placeholder: "#0f9d58", order: 0 },
  { id: "media-2", name: "Swimming Pool", placeholder: "#2563eb", order: 1 },
  { id: "media-3", name: "Executive Suite", placeholder: "#7c3aed", order: 2 },
  { id: "media-4", name: "Restaurant", placeholder: "#ea580c", order: 3 },
  { id: "media-5", name: "Exterior View", placeholder: "#0891b2", order: 4 },
  { id: "media-6", name: "City Panorama", placeholder: "#ca8a04", order: 5 },
]
