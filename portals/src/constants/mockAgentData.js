export const AGENT_TYPES = {
  supervisor: { label: "Supervisor Agent", color: "#0f9d58" },
  destination: { label: "Destination Agent", color: "#2563eb" },
  flight: { label: "Flight Agent", color: "#7c3aed" },
  budget: { label: "Budget Agent", color: "#ea580c" },
  itinerary: { label: "Itinerary Agent", color: "#0891b2" },
  accommodation: { label: "Accommodation Agent", color: "#ca8a04" },
};

export const RUN_STATUSES = {
  COMPLETED: { label: "Completed", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  RUNNING: { label: "Running", tone: "brand" },
  FAILED: { label: "Failed", tone: "red" },
  AWAITING_APPROVAL: { label: "Awaiting Approval", tone: "amber" },
};
