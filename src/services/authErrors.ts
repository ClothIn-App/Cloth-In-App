// src/services/authErrors.ts
// Custom error classes for authentication token management

/**
 * Error thrown when a token has expired and refresh fails
 */
export class TokenExpiredError extends Error {
  constructor(message: string = "Token has expired and refresh failed") {
    super(message);
    this.name = "TokenExpiredError";
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * Error thrown when token refresh API call fails
 */
export class TokenRefreshError extends Error {
  constructor(
    originalError?: Error,
    message: string = "Token refresh failed"
  ) {
    super(message);
    this.name = "TokenRefreshError";
    this.cause = originalError;
    Object.setPrototypeOf(this, TokenRefreshError.prototype);
  }
}

/**
 * Error thrown when token is missing or malformed
 */
export class InvalidTokenError extends Error {
  constructor(message: string = "Invalid or missing token") {
    super(message);
    this.name = "InvalidTokenError";
    Object.setPrototypeOf(this, InvalidTokenError.prototype);
  }
}

