import type { EndpointDefinition } from "../../http";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  idToken: string;
  refreshToken: string;
  user: { uid: string; email: string };
};

export const loginEndpoint: EndpointDefinition<LoginPayload, LoginResponse> = {
  key: "auth.login",
  method: "POST",
  auth: "none",
  pathTemplate: "/v1/auth/login",
  mock: async ({ body }) => {
    // Flip to true to test error state in the UI
    const shouldSimulateError = false;
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (shouldSimulateError) {
      throw new Error("Invalid email or password.");
    }

    const email = (body as LoginPayload).email.toLowerCase();
    return {
      idToken: "mock-id-token-login",
      refreshToken: "mock-refresh-login",
      user: { uid: "mock-uid-456", email },
    };
  },
};
