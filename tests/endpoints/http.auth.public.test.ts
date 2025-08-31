// tests/http.auth.public.test.ts

type Http = typeof import("../..//src/services/http");
type AnyEndpointDef = import("../..//src/services/http").EndpointDefinition<any, any>;

async function importFreshHttp(): Promise<Http> {
  jest.resetModules();
  return await import("../..//src/services/http");
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
  delete process.env.EXPO_PUBLIC_USE_MOCKS;

  if ((global as any).fetch && "mockClear" in (global as any).fetch) {
    (global as any).fetch.mockClear();
  }
});

describe('auth policy "none" (public endpoints)', () => {
  test('REAL mode: Authorization is stripped before fetch', async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";

    const { callApiEndpoint, setAuthTokenProvider } = await importFreshHttp();

    // Provide a token to prove it will be removed when auth: "none"
    setAuthTokenProvider(() => "tok-real-public");

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const publicEndpoint: AnyEndpointDef = {
      key: "public.info",
      method: "GET",
      pathTemplate: "/v1/public/info",
      auth: "none", // <— ensure public
    };

    await callApiEndpoint(publicEndpoint);

    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    const [, init] = (global as any).fetch.mock.calls[0];

    // Header should NOT be present
    expect(init.headers.Authorization).toBeUndefined();
    // But Content-Type should still be set
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  test('MOCK mode: Authorization is stripped before calling mock; fetch not called', async () => {
    process.env.EXPO_PUBLIC_API_MODE = "mock";
    process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";

    const { callApiEndpoint, setAuthTokenProvider } = await importFreshHttp();

    // Provide a token to prove it will be removed when auth: "none"
    setAuthTokenProvider(() => "tok-mock-public");

    // Spy on fetch if present (Node 18+)
    let fetchSpy: jest.SpyInstance | null = null;
    if (typeof (global as any).fetch === "function") {
      fetchSpy = jest.spyOn(global as any, "fetch");
    }

    const mockFn = jest.fn().mockResolvedValue({ ok: true });
    const publicMockEndpoint: AnyEndpointDef = {
      key: "public.ping",
      method: "GET",
      pathTemplate: "/v1/public/ping",
      auth: "none", // <— ensure public
      mock: async (args) => mockFn(args),
    };

    await callApiEndpoint(publicMockEndpoint);

    expect(mockFn).toHaveBeenCalledTimes(1);
    const passed = mockFn.mock.calls[0][0];

    // Header should NOT be present in what the mock receives
    expect(passed.headers.Authorization).toBeUndefined();

    if (fetchSpy) {
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    } else {
      expect((global as any).fetch).toBeUndefined();
    }
  });
});
