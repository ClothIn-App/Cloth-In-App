// tests/apiClient.hybrid.smoke.test.ts
jest.setTimeout(15000);

describe("hybrid smoke", () => {
  let fetchSpy: jest.SpyInstance | null = null;

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
    fetchSpy = null;

    jest.resetModules();
    delete (global as any).fetch;

    delete process.env.EXPO_PUBLIC_API_MODE;
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
    delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
  });

  test("hybrid mode: users.get mocked; auth.signup real", async () => {
    // Arrange env BEFORE imports so modules read correct config
    process.env.EXPO_PUBLIC_API_MODE = "hybrid";
    process.env.EXPO_PUBLIC_MOCK_ROUTES = "users.get";
    process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";
    process.env.EXPO_PUBLIC_API_URL = "http://api.example";

    // Import real modules after env is set
    const http = await import("../../src/services/http");
    const { authApiClient, userApiClient } = await import("../../src/services/apiClients");

    // Provide token required by the users.get mock
    http.setAuthTokenProvider(() => "smoke-token");

    // Spy on global.fetch so any "real" call is intercepted
    fetchSpy = jest.spyOn(global as any, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ created: true }),
    } as any);

    // 1) users.get should be served by its MOCK (no fetch call)
    const user = await userApiClient.getUser("abc-123");
    expect(user.user?.uid).toBe("abc-123");
    expect(fetchSpy).not.toHaveBeenCalled();

    // 2) auth.signup should go through REAL transport (fetch called)
    const signup = await authApiClient.signup({
      email: "a@b.com",
      password: "p",
      confirmPassword: "p",
    });
    expect(signup).toEqual({ created: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("http://api.example/v1/auth/signup");
    expect(init.method).toBe("POST");
  });
});
