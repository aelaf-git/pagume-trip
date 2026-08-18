import HotelFields from "../components/registration/fields/HotelFields";
import AgencyFields from "../components/registration/fields/AgencyFields";
import CarRentalFields from "../components/registration/fields/CarRentalFields";
import DriverGuideFields from "../components/registration/fields/DriverGuideFields";

export const PROVIDER_CATEGORIES = {
  hotel: {
    label: "Hotel / Resort",
    FieldsComponent: HotelFields,
    requiredFields: [
      "name", "description", "address", "latitude", "longitude",
      "contact", "policies", "checkInTime", "checkOutTime",
    ],
  },
  agency: {
    label: "Travel Agency / Tour Operator",
    FieldsComponent: AgencyFields,
    requiredFields: ["agencyName", "businessRegistration"],
    requiredArrayFields: ["specialties"],
  },
  transport: {
    label: "Car Rental Provider",
    FieldsComponent: CarRentalFields,
    requiredFields: ["companyName", "fleetSize"],
    requiredArrayFields: ["pickupLocations", "dropoffLocations"],
  },
  driver: {
    label: "Independent Tour Guide / Driver",
    FieldsComponent: DriverGuideFields,
    requiredFields: ["fullName", "licenseNumber", "licenseExpiry", "experienceLevel"],
    requiredArrayFields: ["languages"],
  },
};
