import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export const ONBOARDING_STATUS_CONFIG = {
  UNDER_REVIEW: {
    label: "Under Review",
    icon: Clock,
    colors: "bg-amber-50 text-amber-700 border-amber-200",
    iconColor: "text-amber-500",
    description:
      "Your application has been submitted and is being reviewed by our verification team. This typically takes 2–3 business days.",
  },
  VERIFIED: {
    label: "Verified",
    icon: CheckCircle2,
    colors: "bg-green-50 text-green-700 border-green-200",
    iconColor: "text-green-500",
    description:
      "Congratulations! Your account is verified. You can now publish listings, manage bookings, and receive payments.",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    colors: "bg-red-50 text-red-700 border-red-200",
    iconColor: "text-red-500",
    description:
      "Your application was rejected. Please review the feedback below, update your information or documents, and resubmit.",
  },
  SUSPENDED: {
    label: "Suspended",
    icon: AlertTriangle,
    colors: "bg-gray-50 text-gray-700 border-gray-200",
    iconColor: "text-gray-500",
    description:
      "Your account has been suspended due to a policy violation or unresolved issue. Please contact support for details.",
  },
};
