// tests/setUser.test.ts

type Http = typeof import("../../src/services/http");
type AnyEndpointDef = import("../../src/services/http").EndpointDefinition<any, any>;

async function importFreshHttp(): Promise<Http> {
  jest.resetModules();
  return await import("../../src/services/http");
}

async function importFreshSetUser() {
  jest.resetModules();
  const mod = await import("../../src/services/endpoints/users/setUser");
  return mod;
}

afterEach(() => {
  // Clean up env and fetch between tests so nothing leaks across cases
  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
  delete process.env.EXPO_PUBLIC_USE_MOCKS;

  if ((global as any).fetch && "mockClear" in (global as any).fetch) {
    (global as any).fetch.mockClear();
  }
});

describe("users.set endpoint — mock behavior", () => {
  test("mock upsert: creates new user then updates fields; email is lowercased", async () => {
    const { setUserEndpoint } = await importFreshSetUser();

    // 1) Create (no prior record) — direct call to mock
    const created = await setUserEndpoint.mock!({
      pathParameters: { userId: "u_demo" },
      queryParameters: {},
      headers: {},
      body: {
        email: "User+UDemo@Example.COM",
        displayName: "New User",
        username: "demo",
        bio: null,
        accountType: "personal",
      },
    });

    expect(created.user.uid).toBe("u_demo");
    expect(created.user.email).toBe("user+udemo@example.com"); // lowercased
    expect(created.user.displayName).toBe("New User");
    expect(created.user.username).toBe("demo");
    expect(created.user.accountType).toBe("personal");
    expect(created.user.counts).toEqual({ posts: 0, following: 0, followers: 0 });

    // 2) Update — same userId, change a couple of fields (persistence check)
    const updated = await setUserEndpoint.mock!({
      pathParameters: { userId: "u_demo" },
      queryParameters: {},
      headers: {},
      body: {
        displayName: "Jane D.",
        accountType: "business",
        // omit email → should keep previous
      },
    });

    expect(updated.user.uid).toBe("u_demo");
    expect(updated.user.email).toBe("user+udemo@example.com"); // unchanged
    expect(updated.user.displayName).toBe("Jane D.");
    expect(updated.user.accountType).toBe("business");
    // counts remain unchanged by setUser
    expect(updated.user.counts).toEqual({ posts: 0, following: 0, followers: 0 });
  });
});

describe("users.set endpoint — survey field", () => {
  test("mock: survey is stored and returned on the user", async () => {
    const { setUserEndpoint } = await importFreshSetUser();
    const survey = { style: ["casual", "minimal"], size: ["M"] };

    const res = await setUserEndpoint.mock!({
      pathParameters: { userId: "u_survey" },
      queryParameters: {},
      headers: {},
      body: { survey },
    });

    expect(res.user.survey).toEqual(survey);
  });

  test("mock: survey persists across a second update that omits it", async () => {
    const { setUserEndpoint } = await importFreshSetUser();
    const survey = { style: ["streetwear"] };

    // First call sets survey
    await setUserEndpoint.mock!({
      pathParameters: { userId: "u_survey2" },
      queryParameters: {},
      headers: {},
      body: { survey },
    });

    // Second call changes name only
    const updated = await setUserEndpoint.mock!({
      pathParameters: { userId: "u_survey2" },
      queryParameters: {},
      headers: {},
      body: { name: "New Name" },
    });

    expect(updated.user.survey).toEqual(survey);
    expect(updated.user.name).toBe("New Name");
  });
});

describe("users.set endpoint — transport integration (auth + mock/real)", () => {
  test("mock mode: requires Authorization (from token provider) and never calls fetch", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "mock";
    process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";

    const { callApiEndpoint, setAuthTokenProvider } = await importFreshHttp();
    const { setUserEndpoint } = await importFreshSetUser();

    setAuthTokenProvider(() => "tok-abc");

    let fetchSpy: jest.SpyInstance | null = null;
    if (typeof (global as any).fetch === "function") {
      fetchSpy = jest.spyOn(global as any, "fetch");
    }

    const res = await callApiEndpoint(setUserEndpoint, {
      pathParameters: { userId: "u1" },
      requestBody: { displayName: "X" },
    });

    expect(res.user.uid).toBe("u1");
    if (fetchSpy) {
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    } else {
      expect((global as any).fetch).toBeUndefined();
    }
  });

  test("mock mode: throws Unauthorized before calling mock when no token", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "mock";
    process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";

    const { callApiEndpoint } = await importFreshHttp();
    const { setUserEndpoint } = await importFreshSetUser();

    // Wrap the endpoint.mock so we can verify it was NOT called
    const mockFn = jest.fn(setUserEndpoint.mock!);
    const endpoint: AnyEndpointDef = { ...setUserEndpoint, mock: mockFn };

    await expect(
      callApiEndpoint(endpoint, {
        pathParameters: { userId: "u2" },
        requestBody: { username: "u2name" },
      })
    ).rejects.toThrow("Unauthorized");

    expect(mockFn).not.toHaveBeenCalled();
  });

  test("real mode: sends PUT to correct URL with JSON body; Authorization header injected", async () => {
    process.env.EXPO_PUBLIC_API_MODE = "real";
    process.env.EXPO_PUBLIC_API_URL = "http://api.test";

    const { callApiEndpoint, setAuthTokenProvider } = await importFreshHttp();
    const { setUserEndpoint } = await importFreshSetUser();

    setAuthTokenProvider(() => "tok-real-1");

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { uid: "u-1" } }),
    });

    const payload = { displayName: "Jane", bio: "Hi" };
    const res = await callApiEndpoint(setUserEndpoint, {
      pathParameters: { userId: "u-1" },
      requestBody: payload,
    });

    expect(res).toEqual({ user: { uid: "u-1" } });
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global as any).fetch.mock.calls[0];

    // Accept either /v1/users/:id or /v1/users/set/:id depending on your endpoint pathTemplate
    expect(url).toMatch(/http:\/\/api\.test\/v1\/users(\/set)?\/u-1$/);

    expect(init.method).toBe("PUT");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer tok-real-1");
    expect(init.body).toBe(JSON.stringify(payload));
  });
});
