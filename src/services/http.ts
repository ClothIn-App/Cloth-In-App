// src/services/http.ts
import { log } from '../debug/log'; // adjust path if needed

const BASE_API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

type ApiMode = "real" | "mock" | "hybrid";

const apiModeFromEnvironment: ApiMode =
  (process.env.EXPO_PUBLIC_API_MODE as ApiMode | undefined) ??
  (process.env.EXPO_PUBLIC_USE_MOCKS === "true" ? "mock" : "real");

const mockedEndpointKeys = new Set(
  (process.env.EXPO_PUBLIC_MOCK_ROUTES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const MOCK_LATENCY_MILLISECONDS = Number(
  process.env.EXPO_PUBLIC_MOCK_LATENCY_MS ?? 400
);

export type EndpointDefinition<RequestBodyType, ResponseBodyType> = {
  key: string; // e.g., "auth.signup"
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  pathTemplate: string; // e.g., "/v1/users/get/:userId"
  allowBodyOnGet?: boolean;
  mock?: (args: {
    body: RequestBodyType | undefined;
    pathParameters: Record<string, string>;
    queryParameters: Record<string, string>;
    headers: Record<string, string>;
  }) => Promise<ResponseBodyType> | ResponseBodyType;
};

type RequestOptions = {
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

type CallOptions<RequestBodyType> = RequestOptions & {
  pathParameters?: Record<string, string | number>;
  queryParameters?: Record<string, string | number | boolean | undefined>;
  requestBody?: RequestBodyType;
};

function shouldUseMockForEndpoint(
  endpointKey: string,
  currentApiMode: ApiMode
): boolean {
  return (
    currentApiMode === "mock" ||
    (currentApiMode === "hybrid" && mockedEndpointKeys.has(endpointKey))
  );
}

function waitForMilliseconds(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function buildPathFromTemplate(
  pathTemplate: string,
  rawPathParameters?: Record<string, string | number>
): { path: string; finalPathParameters: Record<string, string> } {
  const finalPathParameters: Record<string, string> = {};
  const path =
    pathTemplate.replace(/:([A-Za-z0-9_]+)/g, (_, name: string) => {
      const value = rawPathParameters?.[name];
      if (value === undefined || value === null) {
        throw new Error(
          `Missing path parameter "${name}" for "${pathTemplate}"`
        );
      }
      const asString = String(value);
      finalPathParameters[name] = asString;
      return encodeURIComponent(asString);
    }) ?? pathTemplate;

  return { path, finalPathParameters };
}

function buildQueryString(
  rawQueryParameters?: Record<string, string | number | boolean | undefined>
): { queryString: string; finalQueryParameters: Record<string, string> } {
  if (!rawQueryParameters) return { queryString: "", finalQueryParameters: {} };

  const finalQueryParameters: Record<string, string> = {};
  const parts: string[] = [];

  for (const [key, value] of Object.entries(rawQueryParameters)) {
    if (value === undefined) continue;
    const asString = String(value);
    finalQueryParameters[key] = asString;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(asString)}`);
  }
  return {
    queryString: parts.length ? `?${parts.join("&")}` : "",
    finalQueryParameters,
  };
}

/** ---------- Global auth token provider (optional but recommended) ---------- */
type AuthTokenProvider = () => string | null | Promise<string | null>;
let globalAuthTokenProvider: AuthTokenProvider | null = null;

export function setAuthTokenProvider(provider: AuthTokenProvider) {
  globalAuthTokenProvider = provider;
}

async function buildDefaultHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (globalAuthTokenProvider) {
    const token = await Promise.resolve(globalAuthTokenProvider());
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
/** ------------------------------------------------------------------------- */

// Mask sensitive headers when logging
function maskHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...h };
  for (const k of Object.keys(out)) {
    if (k.toLowerCase() === "authorization") {
      const v = out[k] ?? "";
      out[k] = v.length > 20 ? `${v.slice(0, 10)}…${v.slice(-5)}` : "****";
    }
  }
  return out;
}

export async function callApiEndpoint<RequestBodyType, ResponseBodyType>(
  endpointDefinition: EndpointDefinition<RequestBodyType, ResponseBodyType>,
  options: CallOptions<RequestBodyType> = {}
): Promise<ResponseBodyType> {
  const currentApiMode: ApiMode = apiModeFromEnvironment;

  const { path: resolvedPath, finalPathParameters } = buildPathFromTemplate(
    endpointDefinition.pathTemplate,
    options.pathParameters
  );
  const { queryString, finalQueryParameters } = buildQueryString(
    options.queryParameters
  );

  const defaultHeaders = await buildDefaultHeaders();
  const mergedHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...(options.headers ?? {}),
  };

  const shouldIncludeBody =
    endpointDefinition.method !== "GET" || endpointDefinition.allowBodyOnGet;

  const url = `${BASE_API_URL}${resolvedPath}${queryString}`;

  // ---- MOCKED PATH (with logging) ----
  if (shouldUseMockForEndpoint(endpointDefinition.key, currentApiMode)) {
    if (!endpointDefinition.mock) {
      throw new Error(
        `No mock is defined for endpoint key: ${endpointDefinition.key}`
      );
    }

    const startedAt = Date.now();
    log.debug("[HTTP:MOCK_REQUEST]", {
      key: endpointDefinition.key,
      mode: currentApiMode,
      url, // for visibility; no network will be used
      method: endpointDefinition.method,
      headers: maskHeaders(mergedHeaders),
      body: shouldIncludeBody ? options.requestBody : undefined,
      pathParameters: finalPathParameters,
      queryParameters: finalQueryParameters,
    });

    try {
      await waitForMilliseconds(MOCK_LATENCY_MILLISECONDS);
      const mockData = await endpointDefinition.mock({
        body: options.requestBody,
        pathParameters: finalPathParameters,
        queryParameters: finalQueryParameters,
        headers: mergedHeaders,
      });

      const elapsedMs = Date.now() - startedAt;
      log.debug("[HTTP:MOCK_RESPONSE]", {
        key: endpointDefinition.key,
        url,
        ok: true,
        elapsedMs,
        data: mockData,
      });

      return mockData as ResponseBodyType;
    } catch (mockError: any) {
      const elapsedMs = Date.now() - startedAt;
      log.debug("[HTTP:MOCK_ERROR]", {
        key: endpointDefinition.key,
        url,
        elapsedMs,
        error: mockError?.message ?? String(mockError),
      });
      throw mockError;
    }
  }

  // ---- REAL FETCH (with logging) ----
  const init: RequestInit = {
    method: endpointDefinition.method,
    headers: mergedHeaders,
    body: shouldIncludeBody ? JSON.stringify(options.requestBody ?? {}) : undefined,
    signal: options.signal,
  };

  const startedAt = Date.now();
  log.debug("[HTTP:REQUEST]", {
    key: endpointDefinition.key,
    mode: currentApiMode,
    url,
    method: endpointDefinition.method,
    headers: maskHeaders(mergedHeaders),
    body: shouldIncludeBody ? options.requestBody : undefined,
  });

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (networkError: any) {
    const elapsedMs = Date.now() - startedAt;
    log.debug("[HTTP:ERROR]", {
      key: endpointDefinition.key,
      url,
      elapsedMs,
      error: networkError?.message ?? String(networkError),
    });
    throw networkError;
  }

  let responseData: unknown;
  try {
    responseData = await response.json();
  } catch {
    responseData = undefined; // non-JSON / empty
  }

  const elapsedMs = Date.now() - startedAt;
  log.debug("[HTTP:RESPONSE]", {
    key: endpointDefinition.key,
    url,
    status: response.status,
    ok: response.ok,
    elapsedMs,
    data: responseData,
  });

  if (!response.ok) {
    const message =
      (responseData as any)?.detail ||
      (responseData as any)?.message ||
      `${endpointDefinition.key} failed.`;
    throw new Error(String(message));
  }

  return responseData as ResponseBodyType;
}
