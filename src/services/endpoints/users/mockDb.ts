// Shared in-memory user store for mock mode.
// This lets `getUser` and `setUser` share state so profile edits persist.
import type { GetUserResponse } from "./getUser";

const mockUserDb: Map<string, GetUserResponse> = new Map();

export function getUserFromMockDb(
  userId: string
): GetUserResponse | undefined {
  return mockUserDb.get(userId);
}

export function setUserInMockDb(userId: string, value: GetUserResponse): void {
  mockUserDb.set(userId, value);
}


