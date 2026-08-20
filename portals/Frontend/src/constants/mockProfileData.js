/**
 * Mock provider profile data seeded for the 4 mock accounts.
 * Field names match the registration form fields so the same
 * components (HotelFields, AgencyFields, etc.) can be reused for editing.
 *
 * @typedef {Object} ProviderProfile
 * @property {string} id - Matches user.id from authService
 * @property {string} providerType - hotel | agency | transport | driver
 * @property {string} verificationStatus - UNDER_REVIEW | VERIFIED | REJECTED | SUSPENDED
 * @property {Object<string, {name: string, status: string}>} documents
 * @property {string} submittedAt
 * @property {string} updatedAt
 */

export const MOCK_PROFILES = {
  "p-1": {
    id: "p-1",
    providerType: "hotel",
    verificationStatus: "UNDER_REVIEW",
    submittedAt: "2026-07-15T08:30:00Z",
    updatedAt: "2026-08-10T14:20:00Z",
    profileData: {
      name: "Habesha Hotels PLC",
      businessType: "hotel",
      address: "Bole Road, Addis Ababa, Ethiopia",
      latitude: "9.0054",
      longitude: "38.7636",
      contact: "+251911223344",
      starRating: "4",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      currency: "ETB",
      description:
        "A premium hotel in the heart of Addis Ababa offering modern amenities, panoramic city views, and world-class hospitality. Ideal for business travelers and tourists alike.",
      policies:
        "Free cancellation up to 48 hours before check-in. No smoking inside rooms. Pets are not allowed. Breakfast is included for all room types. Quiet hours from 22:00 to 06:00.",
      roomTypes: ["single", "double", "suite", "family"],
      amenities: [
        "Free WiFi",
        "Swimming Pool",
        "Free Parking",
        "Restaurant",
        "Fitness Center",
        "Air Conditioning",
        "Airport Shuttle",
        "Room Service",
      ],
      paymentMethods: ["bank_transfer", "cash", "card", "telebirr"],
      cancellationPolicy: "moderate",
      petPolicy: "not_allowed",
      smokingPolicy: "designated",
      media: [
        { id: "media-1", name: "Hotel Lobby", placeholder: "#0f9d58", order: 0 },
        { id: "media-2", name: "Swimming Pool", placeholder: "#2563eb", order: 1 },
        { id: "media-3", name: "Executive Suite", placeholder: "#7c3aed", order: 2 },
        { id: "media-4", name: "Restaurant", placeholder: "#ea580c", order: 3 },
        { id: "media-5", name: "Exterior View", placeholder: "#0891b2", order: 4 },
        { id: "media-6", name: "City Panorama", placeholder: "#ca8a04", order: 5 },
      ],
    },
    documents: {
      businessLicense: { name: "habesha_business_license.pdf", status: "success" },
      ownershipDoc: { name: "habesha_ownership_cert.pdf", status: "success" },
      bankInfo: { name: "habesha_bank_details.pdf", status: "success" },
    },
  },

  "p-2": {
    id: "p-2",
    providerType: "agency",
    verificationStatus: "VERIFIED",
    submittedAt: "2026-07-18T10:15:00Z",
    updatedAt: "2026-08-05T09:45:00Z",
    profileData: {
      agencyName: "GoGreen Tours",
      businessRegistration: "BRN-2025-0312",
      agencyType: "inbound",
      yearEstablished: "2020",
      currency: "ETB",
      specialties: ["Cultural & Historical", "Wildlife & Safari", "Eco-Tourism", "City Tours"],
      tourTypes: ["historical", "nature", "cultural", "city_tour"],
      description:
        "An eco-conscious tour operator specializing in sustainable travel across Ethiopia. We partner with local communities to deliver authentic cultural experiences while minimizing environmental impact.",
      paymentMethods: ["bank_transfer", "cash", "card", "telebirr", "cbe_birr"],
      primaryLanguages: ["English", "Amharic", "French"],
      physicalAddress: "Bole Road, Addis Ababa, Ethiopia",
    },
    documents: {
      businessLicense: { name: "gogreen_business_reg.pdf", status: "success" },
      tourOperatorLicense: { name: "gogreen_tour_license.pdf", status: "success" },
      bankInfo: { name: "gogreen_bank_info.pdf", status: "success" },
    },
  },

  "p-3": {
    id: "p-3",
    providerType: "transport",
    verificationStatus: "VERIFIED",
    submittedAt: "2026-07-20T14:45:00Z",
    updatedAt: "2026-08-12T11:30:00Z",
    profileData: {
      companyName: "Addis Rent-a-Car",
      fleetSize: "16-50",
      vehicleTypes: ["sedan", "suv", "van", "minibus"],
      transmission: "automatic",
      currency: "ETB",
      pickupLocations: [
        "Bole International Airport",
        "Piazza",
        "Merkato",
        "Bole Medhanealem",
      ],
      dropoffLocations: [
        "Bole International Airport",
        "Arba Minch",
        "Lalibela",
        "Gondar",
        "Bahir Dar",
      ],
      description:
        "A reliable car rental service with a well-maintained fleet of 30+ vehicles. We offer competitive daily and weekly rates with optional professional drivers. All vehicles are insured and regularly serviced.",
      paymentMethods: ["bank_transfer", "cash", "card"],
    },
    documents: {
      businessLicense: { name: "addis_rental_license.pdf", status: "success" },
      vehicleDocs: { name: "addis_vehicle_registrations.pdf", status: "success" },
      bankInfo: { name: "addis_bank_info.pdf", status: "success" },
    },
  },

  "p-4": {
    id: "p-4",
    providerType: "driver",
    verificationStatus: "UNDER_REVIEW",
    submittedAt: "2026-07-22T09:00:00Z",
    updatedAt: "2026-08-08T16:10:00Z",
    profileData: {
      fullName: "Dawit Mengistu",
      licenseNumber: "DL-2024-8812",
      licenseExpiry: "2028-12-31",
      experienceLevel: "experienced",
      languages: ["Amharic", "English", "Afaan Oromo", "Tigrinya"],
      vehicleAvailable: true,
      bio:
        "Professional tour guide and driver with over 6 years of experience across Ethiopia. I specialize in cultural and historical tours through the northern circuit and Oromia region. Fluent in four languages, I ensure every guest has a comfortable and informative journey.",
    },
    verificationDocuments: [
      { key: "driverLicense", label: "Driver's License", status: "APPROVED", expiryDate: "2028-12-31" },
      { key: "guideAssociation", label: "Tour Guide Association Badge", status: "PENDING", expiryDate: null },
      { key: "firstAid", label: "First Aid Certification", status: "APPROVED", expiryDate: "2027-06-15" },
      { key: "vehicleInsurance", label: "Vehicle Insurance", status: "APPROVED", expiryDate: "2027-03-20" },
    ],
    documents: {
      driverLicense: { name: "dawit_drivers_license.pdf", status: "success" },
      nationalId: { name: "dawit_national_id.pdf", status: "success" },
      bankInfo: null,
    },
  },
}
