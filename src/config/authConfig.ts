// src/config/authConfig.ts
// Centralized configuration for authentication token management

export interface AuthConfig {
  /** Token expiry time in milliseconds (default: 1 hour) */
  TOKEN_EXPIRY_MS: number;
  /** Refresh buffer time in milliseconds - refresh token this long before expiry (default: 5 minutes) */
  TOKEN_REFRESH_BUFFER_MS: number;
  /** Number of retries for token refresh on failure (default: 2) */
  TOKEN_REFRESH_RETRIES: number;
  /** Delay between retry attempts in milliseconds (default: 1000ms / 1 second) */
  TOKEN_REFRESH_RETRY_DELAY_MS: number;
}

/**
 * Authentication configuration with environment variable overrides.
 * All values are configurable via environment variables for flexibility.
 */
export const AUTH_CONFIG: AuthConfig = {
  // Default: 1 hour (3600 seconds * 1000ms)
  TOKEN_EXPIRY_MS: Number(
    process.env.EXPO_PUBLIC_TOKEN_EXPIRY_MS ?? 3600000
  ),
  
  // Default: 5 minutes (300 seconds * 1000ms) before expiry
  TOKEN_REFRESH_BUFFER_MS: Number(
    process.env.EXPO_PUBLIC_TOKEN_REFRESH_BUFFER_MS ?? 300000
  ),
  
  // Default: 2 retries
  TOKEN_REFRESH_RETRIES: Number(
    process.env.EXPO_PUBLIC_TOKEN_REFRESH_RETRIES ?? 2
  ),
  
  // Default: 1 second delay between retries
  TOKEN_REFRESH_RETRY_DELAY_MS: Number(
    process.env.EXPO_PUBLIC_TOKEN_REFRESH_RETRY_DELAY_MS ?? 1000
  ),
};

