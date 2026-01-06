/**
 * Development configuration for search service
 * Allows simulating errors for UI testing
 */

// DEV-ONLY: Simple flag to simulate errors for testing UI states
// Set to 'error' to simulate generic error, 'no-connection' for connection error, null to disable
export const DEV_SIMULATE_ERROR: 'error' | 'no-connection' | null = null;

