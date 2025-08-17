# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

# API Layer README — Adding Endpoints & Unit Tests

This codebase uses a small HTTP transport that can run in **real**, **mock**, or **hybrid** mode. Each endpoint is defined **once** (with an optional mock) and the UI calls a single method (`apiClient.*`). This README shows how to add a new endpoint and its tests.

---

## Folder layout (reference)

```
src/
  services/
    http.ts                         # transport + mode switching + token injection
    endpoints/
      auth/
        signup.ts
        login.ts
        index.ts
      users/
        getUser.ts
        index.ts
      products/
        listProducts.ts
        index.ts
      index.ts                      # barrel that re-exports domain barrels
    apiClient.ts                    # thin wrapper that calls `callApiEndpoint`
tests/
  http.test.ts                      # transport-level tests (shared)
  endpoints.test.ts                 # endpoint mock tests (sample)
  apiClient.test.ts                 # apiClient wiring tests (sample)
  apiClient.hybrid.smoke.test.ts    # hybrid-mode smoke test (sample)
  products.hybrid.smoke.test.ts     # optional hybrid smoke for products
  setupTests.ts
jest.config.ts
```

---

## Environment modes

- `EXPO_PUBLIC_API_MODE`: `real` | `mock` | `hybrid`
- `EXPO_PUBLIC_API_URL`: base URL (default: `http://127.0.0.1:8080`)
- `EXPO_PUBLIC_MOCK_ROUTES`: comma-separated endpoint keys to mock in `hybrid`
- `EXPO_PUBLIC_MOCK_LATENCY_MS`: artificial latency for mocks (default: `400`)

Example:
```bash
EXPO_PUBLIC_API_MODE=hybrid \
EXPO_PUBLIC_MOCK_ROUTES=auth.login,users.get \
EXPO_PUBLIC_API_URL=http://localhost:8080 \
npm run start
```

---

## Adding a new endpoint (step-by-step)

Let’s add `GET /v1/products` with optional query `category` and `limit`.

### 1) Define request/response types and the endpoint

Create `src/services/endpoints/products/listProducts.ts`:

```ts
import type { EndpointDefinition } from "../../http";

export type ListProductsQuery = {
  category?: string;
  limit?: number;
};

export type ListProductsResponse = {
  products: Array<{ id: string; name: string; price: number; category?: string }>;
};

export const listProductsEndpoint: EndpointDefinition<undefined, ListProductsResponse> = {
  key: "products.list",
  method: "GET",
  pathTemplate: "/v1/products",
  mock: async ({ queryParameters }) => {
    // Optional: simulate auth requirement using headers.Authorization
    const { category, limit } = queryParameters;
    const all = [
      { id: "p1", name: "Shirt", price: 20, category: "tops" },
      { id: "p2", name: "Jeans", price: 55, category: "bottoms" },
      { id: "p3", name: "Jacket", price: 89, category: "outerwear" },
    ];
    const filtered = category ? all.filter(p => p.category === category) : all;
    const sliced = limit ? filtered.slice(0, Number(limit)) : filtered;
    return { products: sliced };
  },
};
```

> Notes  
> • `key` is how you target this route in `EXPO_PUBLIC_MOCK_ROUTES`.  
> • Use `pathTemplate` with `:param` segments when you need path params (e.g., `/v1/users/:id`).  
> • If a `GET` must carry a body (rare), set `allowBodyOnGet: true`.

### 2) Export from the domain & root barrels

Create `src/services/endpoints/products/index.ts`:
```ts
export * from "./listProducts";
```

Update `src/services/endpoints/index.ts`:
```ts
export * from "./auth";
export * from "./users";
export * from "./products";  // ← add
```

### 3) Add a client method

Update `src/services/apiClient.ts`:

```ts
import { callApiEndpoint } from "./http";
import {
  // existing exports…
  listProductsEndpoint,
  type ListProductsQuery,
  type ListProductsResponse,
} from "./endpoints";

export const apiClient = {
  // existing methods…

  listProducts: (query: ListProductsQuery = {}) =>
    callApiEndpoint<undefined, ListProductsResponse>(listProductsEndpoint, {
      queryParameters: query,
    }),
};
```

### 4) (Optional) Auth header injection

If the route needs auth, set a token provider once (e.g., app bootstrap):

```ts
// src/app/bootstrapAuth.ts
import * as SecureStore from "expo-secure-store";
import { setAuthTokenProvider } from "../services/http";

setAuthTokenProvider(async () => {
  return await SecureStore.getItemAsync("idToken"); // injected as Authorization: Bearer <token>
});
```

### 5) (Optional) Mock only this route in hybrid mode

```bash
EXPO_PUBLIC_API_MODE=hybrid
EXPO_PUBLIC_MOCK_ROUTES=products.list
```

---

## Writing unit tests for a new endpoint

Add **two** kinds of tests per new endpoint:

1) **Endpoint mock tests** — validate the mock’s behavior (filters, errors, headers).  
2) **apiClient wiring tests** — ensure the client calls the transport with the correct endpoint object + options.

You **do not** need new transport tests; `tests/http.test.ts` already covers transport behavior.

### A) Endpoint mock tests

Create/extend `tests/endpoints.test.ts`:

```ts
import {
  listProductsEndpoint,
  type ListProductsResponse,
} from "../src/services/endpoints/products/listProducts";

describe("endpoint mocks", () => {
  test("products.list returns filtered and limited results", async () => {
    const res = await listProductsEndpoint.mock!({
      body: undefined,
      pathParameters: {},
      queryParameters: { category: "tops", limit: "1" },
      headers: {},
    }) as ListProductsResponse;

    expect(res.products.length).toBe(1);
    expect(res.products[0].category).toBe("tops");
  });
});
```

> Tip: If your mock enforces `Authorization`, include a failing case (no header) and a succeeding case (with header).

### B) apiClient wiring tests

Create/extend `tests/apiClient.test.ts`. We **mock** the transport so no network is used:

```ts
jest.mock("../src/services/http", () => {
  const actual = jest.requireActual("../src/services/http");
  return { ...actual, callApiEndpoint: jest.fn() };
});

import { callApiEndpoint } from "../src/services/http";
import { apiClient } from "../src/services/apiClient";
import { listProductsEndpoint } from "../src/services/endpoints";

describe("apiClient wiring", () => {
  beforeEach(() => {
    (callApiEndpoint as unknown as jest.Mock).mockReset();
  });

  test("listProducts forwards endpoint + queryParameters", async () => {
    const query = { category: "tops", limit: 2 };
    const transportResult = { products: [{ id: "p1", name: "Shirt", price: 20, category: "tops" }] };

    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce(transportResult);

    const result = await apiClient.listProducts(query);

    expect(callApiEndpoint).toHaveBeenCalledTimes(1);
    const [endpointArg, optionsArg] = (callApiEndpoint as jest.Mock).mock.calls[0];
    expect(endpointArg).toBe(listProductsEndpoint);
    expect(optionsArg).toEqual({ queryParameters: query });
    expect(result).toBe(transportResult);
  });

  test("listProducts defaults to empty query when omitted", async () => {
    (callApiEndpoint as unknown as jest.Mock).mockResolvedValueOnce({ products: [] });

    await apiClient.listProducts();

    const [, optionsArg] = (callApiEndpoint as jest.Mock).mock.calls[0];
    expect(optionsArg).toEqual({ queryParameters: {} });
  });
});
```

### C) (Optional) Hybrid-mode smoke test

If you want an end-to-end assertion that **only** your new route is mocked:

```ts
// tests/products.hybrid.smoke.test.ts
afterEach(() => {
  jest.resetModules();
  delete (global as any).fetch;
  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
});

test("hybrid: products.list mocked while other endpoints are real", async () => {
  process.env.EXPO_PUBLIC_API_MODE = "hybrid";
  process.env.EXPO_PUBLIC_MOCK_ROUTES = "products.list";
  process.env.EXPO_PUBLIC_MOCK_LATENCY_MS = "0";
  process.env.EXPO_PUBLIC_API_URL = "http://api.example";

  const http = await import("../src/services/http");
  const { apiClient } = await import("../src/services/apiClient");

  // Provide token if your mocks require Authorization
  http.setAuthTokenProvider(() => "token");

  // Stub network for non-mocked endpoints
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true }),
  });

  // Mocked
  const products = await apiClient.listProducts({ limit: 1 });
  expect(products.products.length).toBeGreaterThan(0);
  expect((global as any).fetch).not.toHaveBeenCalled();

  // Real (example: signup)
  await apiClient.signup({ email: "a@b.com", password: "p", confirmPassword: "p" });
  expect((global as any).fetch).toHaveBeenCalledTimes(1);
});
```

---

## Running tests

```bash
# install (once)
npm i -D jest ts-jest @types/jest

# run everything
npm test

# single file
npx jest tests/apiClient.test.ts

# by name
npx jest -t "listProducts"
```

> Node ≥18 provides a global `fetch`. In tests that assert “no network in mock mode,” **spy on** `global.fetch` and assert it wasn’t called (rather than expecting it to be undefined).

---

## Checklist for each new endpoint

- [ ] Add **types** (request/query/response) next to the endpoint.  
- [ ] Create an **EndpointDefinition** with `key`, `method`, `pathTemplate`, and **mock** (optional but recommended).  
- [ ] Export it from the **domain index** and the root `endpoints/index.ts`.  
- [ ] Add a method to **apiClient** that calls `callApiEndpoint` with proper options (`pathParameters`, `queryParameters`, `requestBody`).  
- [ ] Write **endpoint mock tests** (success + error/auth cases).  
- [ ] Write **apiClient wiring tests** (verify endpoint object + options).  
- [ ] (Optional) Add a **hybrid smoke test**.  
- [ ] If protected, ensure **token provider** is set in app bootstrap.
