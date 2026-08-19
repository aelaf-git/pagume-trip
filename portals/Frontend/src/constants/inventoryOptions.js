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
