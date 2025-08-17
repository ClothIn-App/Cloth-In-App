// src/services/endpoints/auth/signup.ts
import type { EndpointDefinition } from "../../http";

export type SignupPayload = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignupResponse = {
  idToken: string;
  refreshToken: string;
  // Keep "uid" to mirror server contract if that is what it returns.
  user: { uid: string; email: string };
};

export const signupEndpoint: EndpointDefinition<
  SignupPayload,
  SignupResponse
> = {
  key: "auth.signup",
  method: "POST",
  pathTemplate: "/v1/auth/signup",
  mock: async ({ body }) => {
    const shouldSimulateError = false;
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (shouldSimulateError) {
      throw new Error("This email is already in use.");
    }
    const email = (body as SignupPayload).email.toLowerCase();
    return {
      idToken: "mock-id-token",
      refreshToken: "mock-refresh",
      user: { uid: "mock-uid-123", email },
    };
  },
};
