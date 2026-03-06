// src/services/endpoints/users/getUser.ts
import type { EndpointDefinition } from "../../http";
import { getUserById } from "../../mockSessionUsers";
import { getUserFromMockDb, setUserInMockDb } from "./mockDb";

export type GetUserResponse = {
  user: {
    uid: string;
    email: string;
    name?: string | null;
    displayName?: string | null;
    username?: string;
    avatarUrl?: string;
    bio?: string | null;
    accountType?: string | null;
    privacy?: { isPrivateAccount?: boolean };
    counts?: {
      posts: number;
      following: number;
      followers: number;
    };
    closet?: {
      base?: { productIds?: string[] };
      racks?: Array<{
        id: string;
        name: string;
        productIds?: string[];
        createdAt?: number;
      }>;
    };
  } | null;
};

export const getUserEndpoint: EndpointDefinition<undefined, GetUserResponse> = {
  key: "users.get",
  method: "GET",
  pathTemplate: "/v1/users/get/:userId",
  auth: "optional",
  mock: async ({ pathParameters }) => {
    // simulate latency
    await new Promise((r) => setTimeout(r, 200));

    const userId = pathParameters.userId;

    // 1) If we've already seen/updated this user in mock mode, return that.
    const existing = getUserFromMockDb(userId);
    if (existing) {
      return existing;
    }

    // 2) Otherwise, try to hydrate from canonical mock-users.json via mockSessionUsers.
    const raw = getUserById(userId);

    if (raw) {
      const hydrated: GetUserResponse = {
        user: {
          uid: raw.id ?? userId,
          email: `user+${userId}@example.com`.toLowerCase(),
          name: raw.displayName ?? raw.username,
          displayName: raw.displayName ?? raw.username,
          username: raw.username,
          avatarUrl: raw.avatarUrl,
          bio: raw.bio ?? null,
          accountType: raw.accountType ?? "personal",
          privacy: raw.privacy ?? { isPrivateAccount: false },
          counts: {
            posts: raw.fitpics?.total ?? 0,
            following: raw.following?.total ?? 0,
            followers: raw.followers?.total ?? 0,
          },
          // Include closet data from mock JSON
          closet: raw.closet,
        },
      };

      setUserInMockDb(userId, hydrated);
      return hydrated;
    }

    // 3) User not in mock-users or mockDb — return null so callers can show "profile not found".
    return { user: null };
  },
};
