export const DOCUMENT_REQUIREMENTS = {
  hotel: [
    { key: "businessLicense", label: "Business Registration / License", required: true },
    { key: "ownershipDoc", label: "Hotel Ownership or Lease Agreement", required: true },
    { key: "bankInfo", label: "Bank Account Information", required: true },
  ],
  agency: [
    { key: "businessLicense", label: "Business Registration Certificate", required: true },
    { key: "tourOperatorLicense", label: "Tour Operator License", required: true },
    { key: "bankInfo", label: "Bank Account Information", required: true },
  ],
  transport: [
    { key: "businessLicense", label: "Business Registration / License", required: true },
    { key: "vehicleDocs", label: "Vehicle Registration Documents", required: true },
    { key: "bankInfo", label: "Bank Account Information", required: true },
  ],
  driver: [
    { key: "driverLicense", label: "Driver's / Tour Guide License", required: true },
    { key: "nationalId", label: "National ID Card", required: true },
    { key: "bankInfo", label: "Bank Account Information", required: false },
  ],
};
