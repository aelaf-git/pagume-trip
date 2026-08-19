# Mock-to-Backend API Mapping

This document details the mock API surface used across all provider portal dashboards.
Backend engineers should replace each mock function with the corresponding HTTP client call.

All endpoints require a Bearer token in the `Authorization` header (JWT from `/api/auth/login`).

---

## Authentication

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `authService.js` | `login(email, password)` | `/api/auth/login` | `POST` | `{ email, password }` | `{ token, user }` |
| `authService.js` | `getCurrentUser()` | `/api/auth/me` | `GET` | — | `{ user }` |

---

## Provider Profile

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `profileService.js` | `getProfile(userId)` | `GET /api/providers/profile` | `GET` | — | `{ id, providerType, verificationStatus, profileData, documents, submittedAt, updatedAt }` |
| `profileService.js` | `updateProfile(userId, updates)` | `PUT /api/providers/profile` | `PUT` | `{ profileData: {...}, documents: {...} }` | `{ profile }` |
| `profileService.js` | `resetProfile(userId)` | `DELETE /api/providers/profile/seed` | `DELETE` | — | `{ profile }` |

**Notes:**
- `userId` is derived from the JWT token on the backend — no need to pass it in the URL
- `profileData` shape varies by `providerType` (see provider-specific sections below)
- `documents` is a map of `{ [key]: { name, status } }`
- `verificationStatus` is one of: `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `SUSPENDED`

---

## Hotel Inventory

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `inventoryService.js` | `getRooms()` | `GET /api/providers/inventory/rooms` | `GET` | — | `Room[]` |
| `inventoryService.js` | `createRoom(data)` | `POST /api/providers/inventory/rooms` | `POST` | `RoomInput` | `Room` |
| `inventoryService.js` | `updateRoom(id, data)` | `PUT /api/providers/inventory/rooms/:id` | `PUT` | `RoomInput` | `Room` |
| `inventoryService.js` | `deleteRoom(id)` | `DELETE /api/providers/inventory/rooms/:id` | `DELETE` | — | `204` |
| `inventoryService.js` | `getRoomCalendar()` | `GET /api/providers/inventory/rooms/calendar` | `GET` | — | `RoomCalendarEntry[]` |
| `inventoryService.js` | `toggleRoomDate(roomId, date)` | `PATCH /api/providers/inventory/rooms/calendar/:roomId/toggle` | `PATCH` | `{ date }` | `RoomCalendarEntry` |
| `inventoryService.js` | `bulkAdjustPrices(roomIds, start, end, adjustment)` | `POST /api/providers/inventory/rooms/calendar/bulk-adjust` | `POST` | `{ roomIds, startDate, endDate, adjustment: { type, value } }` | `RoomCalendarEntry[]` |

**Hotel Profile Data Shape:**
```json
{
  "propertyName": "Habesha Hotel",
  "propertyType": "hotel",
  "starRating": 4,
  "address": "...",
  "city": "Addis Ababa",
  "country": "Ethiopia",
  "phone": "+251...",
  "email": "...",
  "description": "...",
  "amenities": ["wifi", "pool", ...],
  "policies": { "checkIn": "14:00", "checkOut": "11:00", "cancellation": "24h", ... },
  "media": [...]
}
```

---

## Travel Agency Inventory

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `inventoryService.js` | `getPackages()` | `GET /api/providers/inventory/packages` | `GET` | — | `Package[]` |
| `inventoryService.js` | `createPackage(data)` | `POST /api/providers/inventory/packages` | `POST` | `PackageInput` | `Package` |
| `inventoryService.js` | `updatePackage(id, data)` | `PUT /api/providers/inventory/packages/:id` | `PUT` | `PackageInput` | `Package` |
| `inventoryService.js` | `deletePackage(id)` | `DELETE /api/providers/inventory/packages/:id` | `DELETE` | — | `204` |
| `inventoryService.js` | `clonePackage(id)` | `POST /api/providers/inventory/packages/:id/clone` | `POST` | — | `Package` |
| `inventoryService.js` | `togglePackageStatus(id)` | `PATCH /api/providers/inventory/packages/:id/toggle-status` | `PATCH` | — | `Package` |

**Agency Profile Data Shape:**
```json
{
  "agencyName": "Ethiopia Explore Tours",
  "agencyType": "tour_operator",
  "specialties": ["cultural", "adventure", ...],
  "tourTypes": ["group", "private", ...],
  "languages": ["English", "Amharic", ...],
  "yearEstablished": 2018,
  "description": "...",
  "contactName": "...",
  "contactEmail": "...",
  "contactPhone": "..."
}
```

---

## Car Rental (Transport) Inventory

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `inventoryService.js` | `getVehicles()` | `GET /api/providers/inventory/vehicles` | `GET` | — | `Vehicle[]` |
| `inventoryService.js` | `createVehicle(data)` | `POST /api/providers/inventory/vehicles` | `POST` | `VehicleInput` | `Vehicle` |
| `inventoryService.js` | `updateVehicle(id, data)` | `PUT /api/providers/inventory/vehicles/:id` | `PUT` | `VehicleInput` | `Vehicle` |
| `inventoryService.js` | `deleteVehicle(id)` | `DELETE /api/providers/inventory/vehicles/:id` | `DELETE` | — | `204` |
| `inventoryService.js` | `getRentalTerms()` | `GET /api/providers/inventory/rental-terms` | `GET` | — | `RentalTerms` |
| `inventoryService.js` | `updateRentalTerms(data)` | `PUT /api/providers/inventory/rental-terms` | `PUT` | `RentalTermsInput` | `RentalTerms` |

**Transport Profile Data Shape:**
```json
{
  "companyName": "Addis Car Rentals",
  "fleetSize": 8,
  "vehicleTypes": ["sedan", "suv", ...],
  "yearsInBusiness": 5,
  "serviceAreas": ["Addis Ababa", "Bahir Dar", ...],
  "description": "...",
  "contactName": "...",
  "contactEmail": "...",
  "contactPhone": "..."
}
```

---

## Driver / Tour Guide Inventory

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `inventoryService.js` | `getGuideProfile()` | `GET /api/providers/inventory/guide-profile` | `GET` | — | `GuideProfile` |
| `inventoryService.js` | `updateGuideProfile(patch)` | `PUT /api/providers/inventory/guide-profile` | `PUT` | `GuideProfileInput` | `GuideProfile` |

**Driver Profile Data Shape:**
```json
{
  "fullName": "Dawit Mengistu",
  "licenseNumber": "DL-2024-8812",
  "licenseExpiry": "2028-12-31",
  "experienceLevel": "experienced",
  "languages": ["Amharic", "English", ...],
  "coverage": ["Addis Ababa", "Bahir Dar", ...],
  "vehicleAvailable": true,
  "vehicleType": "Toyota Land Cruiser",
  "guidingDayRate": 3500,
  "drivingDayRate": 4500,
  "airportTransferRate": 2500,
  "bio": "..."
}
```

---

## Bookings & Availability

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `bookingService.js` | `getAvailabilityCalendar(type)` | `GET /api/providers/bookings/availability?type=` | `GET` | — | `AvailabilityEntry[]` |
| `bookingService.js` | `toggleAvailability(type, itemId, date)` | `PATCH /api/providers/bookings/availability/toggle` | `PATCH` | `{ providerType, itemId, date }` | `AvailabilityEntry` |
| `bookingService.js` | `getBookings()` | `GET /api/providers/bookings` | `GET` | — | `Booking[]` |
| `bookingService.js` | `confirmBooking(id)` | `PATCH /api/providers/bookings/:id/confirm` | `PATCH` | — | `Booking` |
| `bookingService.js` | `cancelBooking(id)` | `PATCH /api/providers/bookings/:id/cancel` | `PATCH` | — | `Booking` |
| `bookingService.js` | `getAnalytics()` | `GET /api/providers/bookings/analytics` | `GET` | — | `Analytics` |

---

## Driver-Specific Bookings

| Mock Service | Mock Function | HTTP Endpoint | Method | Request Body | Response |
|---|---|---|---|---|---|
| `bookingService.js` | `getDriverCalendar(year, month)` | `GET /api/providers/driver/calendar?year=&month=` | `GET` | — | `CalendarEvent[]` |
| `bookingService.js` | `toggleDriverDate(date, type)` | `PATCH /api/providers/driver/calendar/toggle` | `PATCH` | `{ date, type }` | `CalendarEvent[]` |
| `bookingService.js` | `getDriverAssignments()` | `GET /api/providers/driver/assignments` | `GET` | — | `Assignment[]` |
| `bookingService.js` | `togglePrepStep(assignmentId, stepIndex)` | `PATCH /api/providers/driver/assignments/:id/prep/:stepIndex/toggle` | `PATCH` | — | `Assignment` |
| `bookingService.js` | `addPrepStep(assignmentId, stepText)` | `POST /api/providers/driver/assignments/:id/prep` | `POST` | `{ step }` | `Assignment` |

---

## Migration Checklist for Backend Engineers

### Phase 1 — Profile
- [ ] `profileService.js` → Replace `getProfile` / `updateProfile` / `resetProfile` with Axios calls
- [ ] Remove `localStorage` read/write helpers (`readPersisted`, `writePersisted`)
- [ ] Remove in-memory `profiles` store variable
- [ ] Remove `delay()` calls (backend adds real latency)

### Phase 2 — Inventory
- [ ] `inventoryService.js` → Replace all CRUD functions with Axios calls
- [ ] Remove `MOCK_ROOMS` / `MOCK_PACKAGES` / `MOCK_VEHICLES` / `MOCK_GUIDE_PROFILE` imports
- [ ] Remove in-memory store variables (`rooms`, `packages`, `vehicles`, `guideProfile`, `roomCalendar`, `rentalTerms`)
- [ ] Remove `generateId()` — backend generates IDs

### Phase 3 — Bookings
- [ ] `bookingService.js` → Replace all functions with Axios calls
- [ ] Remove `MOCK_BOOKINGS` / `MOCK_ANALYTICS` / `MOCK_DRIVER_CALENDAR` / `MOCK_DRIVER_ASSIGNMENTS` imports
- [ ] Remove in-memory store variables

### Phase 4 — Auth
- [ ] `authService.js` → Replace mock login with `POST /api/auth/login`
- [ ] Token storage: keep `localStorage` for JWT, remove mock user object

### Axios Base Configuration
```js
import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem("pagume_auth_session") || "null")
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

export default api
```

### Environment Variables
```
VITE_API_URL=http://localhost:3001
```
