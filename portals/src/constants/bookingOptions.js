export const BOOKING_STATUSES = {
  DRAFT: { label: "Draft", tone: "gray" },
  PENDING: { label: "Pending", tone: "amber" },
  AUTHORIZED: { label: "Authorized", tone: "brand" },
  CONFIRMED: { label: "Confirmed", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "red" },
  COMPLETED: { label: "Completed", tone: "green" },
  REFUNDED: { label: "Refunded", tone: "amber" },
};

export const PAYMENT_STATUSES = {
  UNPAID: { label: "Unpaid", tone: "red" },
  PARTIAL: { label: "Partial", tone: "amber" },
  PAID: { label: "Paid", tone: "green" },
  REFUNDED: { label: "Refunded", tone: "gray" },
};

export const CALENDAR_STATUS_COLORS = {
  available: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  booked: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
  reserved: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  blocked: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
};

export const CALENDAR_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
  { value: "reserved", label: "Reserved" },
  { value: "blocked", label: "Blocked" },
];
