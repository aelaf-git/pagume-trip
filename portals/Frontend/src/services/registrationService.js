function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function submitRegistration(payload) {
  await delay(1200);
  // Simulated backend response — replace with a real POST to /api/providers/register
  console.info("Mock registration payload:", payload);
  return {
    providerId: `PRV-${Date.now()}`,
    status: "UNDER_REVIEW",
    submittedAt: new Date().toISOString(),
  };
}

export async function getOnboardingStatus() {
  await delay(400);
  // Replace with a real GET to /api/providers/me/status
  return {
    status: "UNDER_REVIEW",
    submittedAt: new Date().toISOString(),
    reviewNotes: null,
  };
}
