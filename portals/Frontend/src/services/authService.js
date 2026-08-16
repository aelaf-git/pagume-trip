const MOCK_USERS = {
  "provider@pagume.et": {
    password: "password123",
    user: { id: "p-1", name: "Habesha Hotels PLC", email: "provider@pagume.et", role: "provider" },
  },
  "admin@pagume.et": {
    password: "password123",
    user: { id: "a-1", name: "Pagume Admin", email: "admin@pagume.et", role: "admin" },
  },
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login(email, password) {
  await delay(600);
  const record = MOCK_USERS[email.toLowerCase()];
  if (!record || record.password !== password) {
    throw new Error("Invalid email or password.");
  }
  return {
    token: `mock-jwt-${record.user.role}-${Date.now()}`,
    user: record.user,
  };
}

export async function logout() {
  await delay(150);
  return true;
}

