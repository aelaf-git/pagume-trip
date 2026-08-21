import { api } from "./api";
import { REGISTER_TYPE_TO_ROLE } from "../utils/roles";

const STATUS_MAP = {
  PENDING: "UNDER_REVIEW",
  DOCS_REQUESTED: "UNDER_REVIEW",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
};

export async function submitRegistration(payload) {
  const { category, categoryData, documents } = payload;
  const email = categoryData.email || categoryData.contactEmail;
  const password = categoryData.password || categoryData.accountPassword;
  const fullName =
    categoryData.name ||
    categoryData.agencyName ||
    categoryData.companyName ||
    categoryData.fullName ||
    email;

  if (!email || !password) {
    throw new Error(
      "Add email and password (at least 8 characters) in business details so we can create your login."
    );
  }
  if (String(password).length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const role = REGISTER_TYPE_TO_ROLE[category];
  if (!role) throw new Error("Unknown provider type");

  const {
    email: _e,
    password: _p,
    accountPassword: _ap,
    contactEmail: _ce,
    ...details
  } = categoryData;

  const docList = [];
  if (documents && typeof documents === "object") {
    for (const [docType, meta] of Object.entries(documents)) {
      if (!meta) continue;
      docList.push({
        doc_type: docType,
        file_name: meta.name || meta.file_name || docType,
        file_size: meta.size || meta.file_size || 0,
        url: meta.url || null,
      });
    }
  }

  const user = await api.post("/auth/register", {
    email,
    password,
    full_name: fullName,
    role,
    business_name: fullName,
    category,
    phone: categoryData.contact || categoryData.phone || null,
    address: categoryData.address || null,
    details,
    documents: docList,
  });

  return {
    providerId: String(user.id),
    status: "UNDER_REVIEW",
    submittedAt: new Date().toISOString(),
  };
}

export async function getOnboardingStatus() {
  try {
    const data = await api.get("/auth/onboarding");
    return {
      status: STATUS_MAP[data.status] || data.status,
      submittedAt: data.submitted_at,
      reviewNotes: data.review_notes,
      isVerified: data.is_verified,
    };
  } catch {
    return {
      status: "UNDER_REVIEW",
      submittedAt: new Date().toISOString(),
      reviewNotes: null,
    };
  }
}
