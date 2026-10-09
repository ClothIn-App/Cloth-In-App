// src/services/authTokenManager.ts
// Core token management with caching, race condition prevention, and retry logic

import * as SecureStore from '@/src/services/secureStorage';
import { AUTH_CONFIG } from '@/src/config/authConfig';
import { TokenRefreshError, InvalidTokenError } from '@/src/services/authErrors';
import { log } from '@/src/debug/log';
import { clearRealCurrentUser } from '@/src/services/mockSessionUsers';

const TOKEN_EXPIRY_BUFFER = AUTH_CONFIG.TOKEN_REFRESH_BUFFER_MS; // 5 minutes before expiry

const STORAGE_KEY_SUFFIX = '_cloth-in-dev-shaan';
const KEY_ID_TOKEN = `idToken${STORAGE_KEY_SUFFIX}`;
const KEY_REFRESH_TOKEN = `refreshToken${STORAGE_KEY_SUFFIX}`;
const KEY_TOKEN_EXPIRES_AT = `tokenExpiresAt${STORAGE_KEY_SUFFIX}`;

interface TokenData {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

// In-memory cache to avoid SecureStore reads on every API call
let cachedToken: { token: string; expiresAt: number } | null = null;

// Request queue for race condition prevention during token refresh
let refreshPromise: Promise<TokenData | null> | null = null;
const pendingRequests: Array<{
  resolve: (tokenData: TokenData | null) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Get a valid ID token, refreshing if necessary
 * Returns null if no token exists or refresh fails
 */
export async function getValidIdToken(): Promise<string | null> {
  try {
    const now = Date.now();
    
    // Return cached token if still valid and not near expiry
    if (cachedToken && cachedToken.expiresAt > now + TOKEN_EXPIRY_BUFFER) {
      log.debug('[AUTH:GET_VALID_TOKEN] Using cached token');
      return cachedToken.token;
    }
    
    const tokenData = await getStoredTokenData();
    if (!tokenData) {
      log.debug('[AUTH:GET_VALID_TOKEN] No stored token data');
      return null;
    }

    // Check if token is expired or about to expire (or missing expiry = expired)
    if (tokenData.expiresAt <= 0 || tokenData.expiresAt - now < TOKEN_EXPIRY_BUFFER) {
      log.debug('[AUTH:GET_VALID_TOKEN] Token expired or near expiry, attempting refresh');
      const refreshed = await refreshIdToken(tokenData.refreshToken);
      if (refreshed) {
        cachedToken = { token: refreshed.idToken, expiresAt: refreshed.expiresAt };
        return refreshed.idToken;
      }
      // Refresh failed, clear tokens
      log.warn('[AUTH:GET_VALID_TOKEN] Token refresh failed, clearing tokens');
      await clearTokens();
      return null;
    }

    // Token is still valid, update cache and return
    cachedToken = { token: tokenData.idToken, expiresAt: tokenData.expiresAt };
    return tokenData.idToken;
  } catch (error: any) {
    log.error('[AUTH:GET_VALID_TOKEN_ERROR]', { error: error?.message ?? String(error) });
    await clearTokens().catch(() => {}); // Ignore errors during cleanup
    return null;
  }
}

/**
 * Refresh ID token using refresh token
 * Implements request queue to prevent multiple simultaneous refresh calls
 */
async function refreshIdToken(refreshToken: string): Promise<TokenData | null> {
  // If refresh is already in progress, queue this request
  if (refreshPromise) {
    log.debug('[AUTH:TOKEN_REFRESH_QUEUE] Refresh already in progress, queuing request');
    return new Promise<TokenData | null>((resolve, reject) => {
      pendingRequests.push({ resolve, reject });
    });
  }

  refreshPromise = (async () => {
    log.debug('[AUTH:TOKEN_REFRESH_START]');
    const startTime = Date.now();
    const maxAttempts = AUTH_CONFIG.TOKEN_REFRESH_RETRIES + 1;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        log.warn('[AUTH:TOKEN_REFRESH_RETRY]', { attempt: attempt - 1, error: lastError?.message ?? String(lastError) });
        await new Promise((resolve) => setTimeout(resolve, AUTH_CONFIG.TOKEN_REFRESH_RETRY_DELAY_MS));
      }

      try {
        const api_key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
        if (!api_key) {
          throw new InvalidTokenError('EXPO_PUBLIC_FIREBASE_API_KEY is missing for token refresh');
        }

        const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
        const tokenRefreshUrl = emulatorHost
          ? `http://${emulatorHost}/securetoken.googleapis.com/v1/token?key=${api_key}`
          : `https://securetoken.googleapis.com/v1/token?key=${api_key}`;

        const timeoutMs = AUTH_CONFIG.TOKEN_REFRESH_FETCH_TIMEOUT_MS;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        let response: Response;
        try {
          response = await fetch(tokenRefreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grant_type: 'refresh_token',
              refresh_token: refreshToken,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          log.error('[AUTH:TOKEN_REFRESH_FAILED_API]', {
            status: response.status,
            error: errorData,
            elapsedMs: Date.now() - startTime,
          });
          throw new TokenRefreshError(
            new Error(errorData.error?.message || 'Firebase token refresh failed')
          );
        }

        const data = await response.json();
        const expiresAt = Date.now() + AUTH_CONFIG.TOKEN_EXPIRY_MS;

        const tokenData: TokenData = {
          idToken: data.id_token,
          refreshToken: data.refresh_token || refreshToken,
          expiresAt,
        };

        await storeTokenData(tokenData);
        log.debug('[AUTH:TOKEN_REFRESH_SUCCESS]', { elapsedMs: Date.now() - startTime });

        const requestsToResolve = [...pendingRequests];
        pendingRequests.length = 0;
        requestsToResolve.forEach(({ resolve }) => resolve(tokenData));

        return tokenData;
      } catch (error: any) {
        lastError = error;
        const isAbort =
          error?.name === 'AbortError' ||
          (typeof error?.message === 'string' && error.message.includes('aborted'));
        // Don't retry on non-recoverable errors (invalid token, missing config)
        const isRetryable =
          error instanceof TokenRefreshError ||
          error instanceof TypeError ||
          isAbort;
        if (!isRetryable || attempt === maxAttempts) {
          break;
        }
      }
    }

    log.error('[AUTH:TOKEN_REFRESH_FAILED]', {
      error: lastError?.message ?? String(lastError),
      elapsedMs: Date.now() - startTime,
    });
    const requestsToFlush = [...pendingRequests];
    pendingRequests.length = 0;
    requestsToFlush.forEach(({ resolve }) => resolve(null));
    return null;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Store token data with expiry
 */
export async function storeTokenData(tokenData: TokenData): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY_ID_TOKEN, tokenData.idToken);
    await SecureStore.setItemAsync(KEY_REFRESH_TOKEN, tokenData.refreshToken);
    await SecureStore.setItemAsync(KEY_TOKEN_EXPIRES_AT, tokenData.expiresAt.toString());
    cachedToken = { token: tokenData.idToken, expiresAt: tokenData.expiresAt }; // Update cache
    log.debug('[AUTH:TOKENS_STORED]');
  } catch (error: any) {
    log.error('[AUTH:STORE_TOKENS_ERROR]', { error: error?.message ?? String(error) });
    throw error;
  }
}

/**
 * Get stored token data from SecureStore
 */
async function getStoredTokenData(): Promise<TokenData | null> {
  try {
    const idToken = await SecureStore.getItemAsync(KEY_ID_TOKEN);
    if (!idToken) return null;

    const refreshToken = await SecureStore.getItemAsync(KEY_REFRESH_TOKEN);
    if (!refreshToken) return null;

    const expiresAtStr = await SecureStore.getItemAsync(KEY_TOKEN_EXPIRES_AT);
    // If tokenExpiresAt is missing, assume token is expired (old token from before expiry tracking)
    // Set to 0 to force refresh attempt
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;

    return { idToken, refreshToken, expiresAt };
  } catch (error: any) {
    log.error('[AUTH:GET_STORED_TOKENS_ERROR]', { error: error?.message ?? String(error) });
    return null;
  }
}

/**
 * Clear all stored tokens
 */
export async function clearTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY_ID_TOKEN);
    await SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEY_TOKEN_EXPIRES_AT);
    cachedToken = null; // Clear cache
    clearRealCurrentUser();
    log.info('[AUTH:TOKENS_CLEARED]');
  } catch (error: any) {
    log.error('[AUTH:CLEAR_TOKENS_ERROR]', { error: error?.message ?? String(error) });
    // Don't throw - clearing tokens should be best-effort
  }
}

