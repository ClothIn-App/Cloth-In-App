// tests/http.test.ts
type AnyEndpointDef = import("../src/services/http").EndpointDefinition<any, any>;

// Helper: import a fresh http module *after* setting env per test
async function importHttp() {
  jest.resetModules();
  const mod = await import("../src/services/http");
  return mod;
}

afterEach(() => {
  // Clean up between tests so env/config doesn't leak
  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
  delete process.env.EXPO_PUBLIC_USE_MOCKS;

  // Reset any fetch mocks
  if ((global as any).fetch && "mockClear" in (global as any).fetch) {
    (global as any).fetch.mockClear();
  }
  // optional: unset to force tests to set it explicitly
  // (global as any).fetch = undefined;
});

describe("HTTP transport (callApiEndpoint)", () => {
  test("mock mode uses endpoint.mock and never calls fetch", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "mock";
    process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";

    const { callApiEndpoint, setAuthTokenProvider } = await importHttp();
    setAuthTokenProvider(() => "token-123");

    // If Node provides global.fetch (Node 18+), spy on it
    let fetchSpy: jest.SpyInstance | null = null;
    if (typeof (global as any).fetch === "function") {
      fetchSpy = jest.spyOn(global as any, "fetch");
    }

    const mockFn = jest.fn().mockResolvedValue({ ok: true, value: 42 });

    const endpoint: AnyEndpointDef = {
      key: "things.read",
      method: "GET",
      pathTemplate: "/v1/things/:id",
      // default auth: "required" -> fine because we set a token provider above
      mock: async (args) => mockFn(args),
    };

    const result = await callApiEndpoint(endpoint, {
      pathParameters: { id: "abc" },
      queryParameters: { limit: 10, flag: true },
    });

    expect(result).toEqual({ ok: true, value: 42 });
    expect(mockFn).toHaveBeenCalledTimes(1);
    const passed = mockFn.mock.calls[0][0];
    expect(passed.pathParameters.id).toBe("abc");
    expect(passed.queryParameters.limit).toBe("10");
    expect(passed.headers.Authorization).toBe("Bearer token-123");

    if (fetchSpy) {
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    } else {
      expect((global as any).fetch).toBeUndefined();
    }
  });

  test("real mode builds URL with path + query; GET has no body; headers merged", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
    const { callApiEndpoint, setAuthTokenProvider } = await importHttp();

    setAuthTokenProvider(() => "xyz");
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: "world" }),
    });

    const endpoint: AnyEndpointDef = {
      key: "users.get",
      method: "GET",
      pathTemplate: "/v1/users/get/:userId",
      // default auth "required" is fine; we set a token provider above
    };

    const res = await callApiEndpoint(endpoint, {
      pathParameters: { userId: "u-1" },
      queryParameters: { limit: 5, q: "A B" },
      headers: { "X-Debug": "1" },
    });

    expect(res).toEqual({ hello: "world" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://api.test/v1/users/get/u-1?limit=5&q=A%20B");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer xyz");
    expect(init.headers["X-Debug"]).toBe("1");
  });

  test("POST request sends JSON body", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
    const { callApiEndpoint } = await importHttp();

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ created: true }),
    });

    const endpoint: AnyEndpointDef = {
      key: "auth.signup",
      method: "POST",
      pathTemplate: "/v1/auth/signup",
      auth: "none", // public route in tests
    };

    await callApiEndpoint(endpoint, {
      requestBody: { email: "A@B.com", password: "p", confirmPassword: "p" },
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({ email: "A@B.com", password: "p", confirmPassword: "p" })
    );
  });

  test("GET allows body only when allowBodyOnGet = true", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
    const { callApiEndpoint } = await importHttp();

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const endpointWithBody: AnyEndpointDef = {
      key: "query.search",
      method: "GET",
      pathTemplate: "/v1/search",
      allowBodyOnGet: true,
      auth: "none", // avoid Unauthorized in this test
    };

    await callApiEndpoint(endpointWithBody, {
      requestBody: { filters: ["a"] },
    });

    let [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBe(JSON.stringify({ filters: ["a"] }));

    // now without allowBodyOnGet
    (global as any).fetch.mockClear();
    const endpointNoBody: AnyEndpointDef = {
      key: "query.search2",
      method: "GET",
      pathTemplate: "/v1/search",
      auth: "none", // avoid Unauthorized in this test
    };
    await callApiEndpoint(endpointNoBody, {
      requestBody: { filters: ["a"] },
    });
    [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.body).toBeUndefined();
  });

  test("throws helpful error when path parameter missing", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
    const { callApiEndpoint } = await importHttp();

    const endpoint: AnyEndpointDef = {
      key: "users.get",
      method: "GET",
      pathTemplate: "/v1/users/get/:userId",
      auth: "none", // ensure auth doesn't mask path error
    };

    await expect(
      callApiEndpoint(endpoint) // no pathParameters
    ).rejects.toThrow('Missing path parameter "userId"');
  });

  test("error handling prefers detail, then message, else generic", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
    const { callApiEndpoint } = await importHttp();

    (global as any).fetch = jest.fn()
      // case 1: detail
      .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: "Nope" }) })
      // case 2: message
      .mockResolvedValueOnce({ ok: false, json: async () => ({ message: "Bad" }) })
      // case 3: non-JSON/empty
      .mockResolvedValueOnce({ ok: false, json: async () => { throw new Error("bad json"); } });

    const endpoint: AnyEndpointDef = {
      key: "auth.signup",
      method: "POST",
      pathTemplate: "/v1/auth/signup",
      auth: "none", // public for test
    };

    await expect(callApiEndpoint(endpoint, { requestBody: {} })).rejects.toThrow("Nope");
    await expect(callApiEndpoint(endpoint, { requestBody: {} })).rejects.toThrow("Bad");
    await expect(callApiEndpoint(endpoint, { requestBody: {} })).rejects.toThrow("auth.signup failed.");
  });

  test("hybrid mode: only endpoints listed in EXPO_PUBLIC_MOCK_ROUTES are mocked", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "hybrid";
    process.env.EXPO_PUBLIC_MOCK_ROUTES = "users.get";
    process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";

    const { callApiEndpoint, setAuthTokenProvider } = await importHttp();
    // Provide token so required-auth endpoints don't throw
    setAuthTokenProvider(() => "tok-1");

    const usersMock = jest.fn().mockResolvedValue({ user: { uid: "1" } });
    const usersEndpoint: AnyEndpointDef = {
      key: "users.get",
      method: "GET",
      pathTemplate: "/v1/users/get/:id",
      mock: async (args) => usersMock(args),
      // default auth "required" is fine because we set token
    };

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const otherEndpoint: AnyEndpointDef = {
      key: "items.list",
      method: "GET",
      pathTemplate: "/v1/items",
      auth: "none", // treat as public for this test
    };

    const a = await callApiEndpoint(usersEndpoint, { pathParameters: { id: "1" } });
    const b = await callApiEndpoint(otherEndpoint);

    expect(a).toEqual({ user: { uid: "1" } });          // came from mock
    expect(b).toEqual({ ok: true });                     // came from real fetch
    expect(usersMock).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  test("BASE_API_URL falls back when env unset; uses env when set", async () => {
    // 1) default
    process.env.EXPO_PUBLIC_API_MODE = "real";
    const { callApiEndpoint: callDefault } = await importHttp();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    await callDefault(
      { key: "ping", method: "GET", pathTemplate: "/v1/ping", auth: "none" },
      {}
    );
    let [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("http://127.0.0.1:8080/v1/ping");

    // 2) with env
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
    const { callApiEndpoint: callWithEnv } = await importHttp();
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    await callWithEnv(
      { key: "ping", method: "GET", pathTemplate: "/v1/ping", auth: "none" },
      {}
    );
    [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.example.com/v1/ping");
  });

  test("Authorization header is injected from global token provider", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";
    const { callApiEndpoint, setAuthTokenProvider } = await importHttp();

    setAuthTokenProvider(async () => "id-token-999");

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await callApiEndpoint(
      { key: "users.get", method: "GET", pathTemplate: "/v1/users/get/:id" },
      { pathParameters: { id: "abc" } }
    );

    const [, init] = (global as any).fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer id-token-999");
  });
});
