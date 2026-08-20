import * as authService from "./authService";

export async function submitRegistration(payload) {
  const { category, categoryData } = payload;
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

  const user = await authService.register({
    email,
    password,
    fullName,
    providerType: category,
  });

  return {
    providerId: String(user.id),
    status: "UNDER_REVIEW",
    submittedAt: new Date().toISOString(),
  };
}

export async function getOnboardingStatus() {
  return {
    status: "UNDER_REVIEW",
    submittedAt: new Date().toISOString(),
    reviewNotes: null,
  };
}
