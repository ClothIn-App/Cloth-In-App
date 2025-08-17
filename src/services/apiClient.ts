// src/services/apiClient.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8080';
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

export type SignupPayload = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignupResponse = {
  idToken: string;
  refreshToken: string;
  user: { uid: string; email: string };
};

// --- real network call ---
async function realSignup(payload: SignupPayload): Promise<SignupResponse> {
  const res = await fetch(`${API_URL}/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: any = {};
  try { data = await res.json(); } catch { /* ignore parse errors */ }

  if (!res.ok) {
    const message = data?.detail || data?.message || 'Signup failed.';
    throw new Error(message);
  }
  return data as SignupResponse;
}

// --- mock for UI testing without backend ---
async function mockSignup(payload: SignupPayload): Promise<SignupResponse> {
  await new Promise(r => setTimeout(r, 500)); // simulate network delay
  // Flip to true to test error state in the UI:
  const simulateError = false;
  if (simulateError) throw new Error('This email is already in use.');
  return {
    idToken: 'mock-id-token',
    refreshToken: 'mock-refresh',
    user: { uid: 'mock-uid-123', email: payload.email.toLowerCase() },
  };
}

export const apiClient = {
  signup: (p: SignupPayload) => (USE_MOCKS ? mockSignup(p) : realSignup(p)),
};
