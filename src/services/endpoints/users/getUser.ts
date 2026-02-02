// src/services/endpoints/users/getUser.ts
import type { EndpointDefinition } from "../../http";
import { log } from "../../../debug/log";
import { getCurrentUser, getUserById } from "../../mockSessionUsers";
import { getUserFromMockDb, setUserInMockDb } from "./mockDb";

export type GetUserResponse = {
  user: {
    uid: string;
    email: string;
    displayName?: string | null;
    username?: string;
    avatarUrl?: string;
    bio?: string | null;
    accountType?: string | null;
    /** Viewer relationship: only set when viewing another user's profile */
    isPrivateAccount?: boolean;
    isFollowing?: boolean;
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
  };
};

export const getUserEndpoint: EndpointDefinition<undefined, GetUserResponse> = {
  key: "users.get",
  method: "GET",
  pathTemplate: "/v1/users/get/:userId",
  mock: async ({ pathParameters }) => {
    // simulate latency
    await new Promise((r) => setTimeout(r, 200));

    const userId = pathParameters.userId;
    const raw = getUserById(userId);
    const currentUser = getCurrentUser();
    const isFollowing = currentUser?.following?.userIds?.includes(userId) ?? false;
    const isPrivateAccount = raw?.privacy?.isPrivateAccount ?? false;

    const withRelationship = (user: GetUserResponse["user"]): GetUserResponse["user"] => ({
      ...user,
      isPrivateAccount,
      isFollowing,
    });

    // 1) If we've already seen/updated this user in mock mode, return that with relationship.
    const existing = getUserFromMockDb(userId);
    if (existing) {
      return { user: withRelationship(existing.user) };
    }

    // 2) Otherwise, try to hydrate from canonical mock-users.json via mockSessionUsers.
    if (raw) {
      const hydrated: GetUserResponse = {
        user: withRelationship({
          uid: raw.id ?? userId,
          email: `user+${userId}@example.com`.toLowerCase(),
          displayName: raw.displayName ?? raw.username,
          username: raw.username,
          avatarUrl: raw.avatarUrl,
          bio: raw.bio ?? null,
          accountType: "personal",
          counts: {
            posts: raw.fitpics?.total ?? 0,
            following: raw.following?.total ?? 0,
            followers: raw.followers?.total ?? 0,
          },
          closet: raw.closet,
        }),
      };

      setUserInMockDb(userId, { ...hydrated, user: { ...hydrated.user } });
      return hydrated;
    }

    // 3) Fallback: synthesize a simple demo user (previous behaviour).
    log("getUserEndpoint.mock: falling back to synthesized user", { userId });

    const synthesized: GetUserResponse = {
      user: withRelationship({
        uid: userId,
        email: `user+${userId}@example.com`.toLowerCase(),
        displayName: "Jane Doe",
        username: "janedoe",
        avatarUrl: "https://example.com/avatars/jane.png",
        bio: "Clothes & coffee.",
        accountType: "personal",
        counts: {
          posts: 12,
          following: 87,
          followers: 143,
        },
      }),
    };

    setUserInMockDb(userId, synthesized);
    return synthesized;
  },
};
