// src/services/http.ts
import { log } from '../debug/log'; // adjust path if needed

export function messageFromResponseBody(body: unknown, fallback: string): string {
  if (body == null || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  const d = b.detail;
  if (typeof d === "string" && d.trim()) return d;
  if (Array.isArray(d)) {
    const parts = d.map((item: unknown) => {
      if (item != null && typeof item === "object" && "msg" in item) {
        return String((item as { msg: unknown }).msg);
      }
      return JSON.stringify(item);
    });
    const joined = parts.filter(Boolean).join("; ");
    return joined || fallback;
  }
  const m = b.message;
  if (typeof m === "string" && m.trim()) return m;
  return fallback;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

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

/** ---------------------- Endpoint Definition ---------------------- */
export type EndpointDefinition<RequestBodyType, ResponseBodyType> = {
  key: string; // e.g., "auth.signup"
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  pathTemplate: string; // e.g., "/v1/users/get/:userId"
  allowBodyOnGet?: boolean;

  /**
   * Auth policy:
   *  - "required" (default): must have Authorization header, or throw before request/mock
   *  - "optional": include Authorization if available, but do not require it
   *  - "none": do NOT require or send Authorization (strips the header if present)
   */
  auth?: "required" | "optional" | "none";

  mock?: (args: {
    body: RequestBodyType | undefined;
    pathParameters: Record<string, string>;
    queryParameters: Record<string, string>;
    headers: Record<string, string>;
  }) => Promise<ResponseBodyType> | ResponseBodyType;
};
/** ----------------------------------------------------------------- */

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

  // ------------------ Centralized auth policy enforcement ------------------
  const authPolicy: "required" | "optional" | "none" =
    endpointDefinition.auth ?? "required";
  // Preserve full union for 401 block (call sites may use narrower auth type)
  const authPolicyForRetry: "required" | "optional" | "none" = (endpointDefinition.auth ??
    "required") as "required" | "optional" | "none";

  // If public, strip any Authorization header so we don't leak it
  if (authPolicy === "none" && "Authorization" in mergedHeaders) {
    delete mergedHeaders.Authorization;
  }

  // If required, enforce before mock or network
  if (authPolicy === "required" && !mergedHeaders.Authorization) {
    log.debug("[HTTP:AUTH_MISSING]", {
      key: endpointDefinition.key,
      path: resolvedPath,
    });
    throw new ApiError(401, "Unauthorized");
  }
  // ------------------------------------------------------------------------

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

  // Handle 401 Unauthorized - attempt token refresh and retry
  if (response.status === 401 && (authPolicyForRetry as "required" | "optional" | "none") !== "none") {
    log.debug("[HTTP:401_UNAUTHORIZED]", {
      key: endpointDefinition.key,
      url,
    });

    // Only attempt refresh if we're in real API mode and have auth
    if (currentApiMode === "real" && (authPolicyForRetry as "required" | "optional" | "none") !== "none") {
      try {
        // Dynamically import to avoid circular dependencies
        const { getValidIdToken } = await import('@/src/services/authTokenManager');
        const { authEvents } = await import('@/src/services/authEvents');
        
        // Attempt to refresh token
        const newToken = await getValidIdToken();
        
        if (newToken) {
          // Retry original request with new token
          log.debug("[HTTP:TOKEN_REFRESH_RETRY]", {
            key: endpointDefinition.key,
            url,
          });
          
          // Rebuild headers with new token
          const retryHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${newToken}`,
            ...(options.headers ?? {}),
          };
          
          // Strip Authorization if auth policy is "none" (shouldn't happen here, but safety check)
          if ((authPolicyForRetry as "required" | "optional" | "none") === "none" && "Authorization" in retryHeaders) {
            delete retryHeaders.Authorization;
          }
          
          const retryInit: RequestInit = {
            method: endpointDefinition.method,
            headers: retryHeaders,
            body: shouldIncludeBody ? JSON.stringify(options.requestBody ?? {}) : undefined,
            signal: options.signal,
          };
          
          const retryStartedAt = Date.now();
          let retryResponse: Response;
          try {
            retryResponse = await fetch(url, retryInit);
          } catch (retryNetworkError: any) {
            const retryElapsedMs = Date.now() - retryStartedAt;
            log.debug("[HTTP:RETRY_ERROR]", {
              key: endpointDefinition.key,
              url,
              retryElapsedMs,
              error: retryNetworkError?.message ?? String(retryNetworkError),
            });
            throw retryNetworkError;
          }
          
          let retryResponseData: unknown;
          try {
            retryResponseData = await retryResponse.json();
          } catch {
            retryResponseData = undefined;
          }
          
          const retryElapsedMs = Date.now() - retryStartedAt;
          log.debug("[HTTP:RETRY_RESPONSE]", {
            key: endpointDefinition.key,
            url,
            status: retryResponse.status,
            ok: retryResponse.ok,
            retryElapsedMs,
            data: retryResponseData,
          });
          
          if (retryResponse.ok) {
            return retryResponseData as ResponseBodyType;
          }
          
          // If retry still returns 401, token refresh didn't help - emit event and fail
          if (retryResponse.status === 401) {
            log.warn("[HTTP:RETRY_STILL_401]", {
              key: endpointDefinition.key,
              url,
            });
            authEvents.emit('token_expired');
            throw new ApiError(
              401,
              messageFromResponseBody(
                retryResponseData,
                `${endpointDefinition.key} failed: Unauthorized`
              ),
              retryResponseData
            );
          }
        } else {
          // Token refresh failed - emit event and fail
          log.warn("[HTTP:TOKEN_REFRESH_FAILED]", {
            key: endpointDefinition.key,
            url,
          });
          const { authEvents } = await import('@/src/services/authEvents');
          authEvents.emit('token_expired');
          throw new ApiError(
            401,
            messageFromResponseBody(
              responseData,
              `${endpointDefinition.key} failed: Unauthorized`
            ),
            responseData
          );
        }
      } catch (refreshError: any) {
        // If refresh attempt itself fails, emit event and throw
        log.error("[HTTP:TOKEN_REFRESH_ERROR]", {
          key: endpointDefinition.key,
          url,
          error: refreshError?.message ?? String(refreshError),
        });
        const { authEvents } = await import('@/src/services/authEvents');
        authEvents.emit('token_expired');
        throw refreshError;
      }
    } else {
      // Not in real mode or no auth required - just throw the error
      throw new ApiError(
        401,
        messageFromResponseBody(
          responseData,
          `${endpointDefinition.key} failed: Unauthorized`
        ),
        responseData
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFromResponseBody(
        responseData,
        `${endpointDefinition.key} failed.`
      ),
      responseData
    );
  }

  return responseData as ResponseBodyType;
}
