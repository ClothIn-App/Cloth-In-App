// tests/apiClient.hybrid.smoke.test.ts

/**
 * This file DOES NOT mock callApiEndpoint.
 * It verifies that:
 *  - In hybrid mode, users.get is served by its mock (no fetch)
 *  - While another route (auth.signup) still hits fetch (real)
 */

afterEach(() => {
  jest.resetModules();
  delete (global as any).fetch;

  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
});

test("hybrid mode: users.get mocked; auth.signup real", async () => {
  // Arrange environment for hybrid mocking
  process.env.EXPO_PUBLIC_API_MODE = "hybrid";
  process.env.EXPO_PUBLIC_MOCK_ROUTES = "users.get";
  process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";
  process.env.EXPO_PUBLIC_API_URL = "http://api.example";

  // Import real modules AFTER setting env
  const http = await import("../src/services/http");
  const { authApiClient, userApiClient } = await import("../src/services/apiClients");

  // getUser mock requires Authorization; provide a token globally
  http.setAuthTokenProvider(() => "smoke-token");

  // Stub fetch; users.get shouldn't call it, signup should
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ created: true }),
  });

  // 1) users.get should be served by the mock (no fetch)
  const userId = "abc-123";
  const userRes = await userApiClient.getUser(userId);

  expect(userRes.user.uid).toBe(userId);
  expect(userRes.user.email).toBe(`user+${userId}@example.com`);
  expect((global as any).fetch).not.toHaveBeenCalled();

  // 2) auth.signup should go to the network (fetch called)
  const signupRes = await authApiClient.signup({
    email: "a@b.com",
    password: "p",
    confirmPassword: "p",
  });

  expect((global as any).fetch).toHaveBeenCalledTimes(1);
  expect(signupRes).toEqual({ created: true });

  // Bonus: verify URL constructed as expected
  const [url, init] = (global as any).fetch.mock.calls[0];
  expect(url).toBe("http://api.example/v1/auth/signup");
  expect(init.method).toBe("POST");
});
