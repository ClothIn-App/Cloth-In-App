import { Platform } from "react-native";

function generateId(): string {
  const chars = "0123456789abcdef";
  let uuid = "";
  for (let i = 0; i < 32; i++) {
    const r = Math.floor(Math.random() * 16);
    if (i === 8 || i === 12 || i === 16 || i === 20) uuid += "-";
    uuid += i === 12 ? "4" : i === 16 ? chars[(r & 0x3) | 0x8] : chars[r];
  }
  return uuid;
}

let _sessionId: string | null = null;

/**
 * Returns a stable session ID for the current app session.
 * Generated once on first access and held in memory.
 */
export function getAnalyticsSessionId(): string {
  if (!_sessionId) {
    _sessionId = generateId();
  }
  return _sessionId;
}

/** Reset the session (call on explicit app restart / new login if needed). */
export function resetAnalyticsSession(): void {
  _sessionId = generateId();
}

export function getAnalyticsDevice(): string {
  return Platform.OS;
}
