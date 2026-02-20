import type { EndpointDefinition } from "../../http";
import type { GetUserResponse } from "./getUser";
import { getUserFromMockDb, setUserInMockDb } from "./mockDb";

/** Fields the client can create/update */
export type SetUserPayload = {
  email?: string; // optional; will be lowercased if provided
  displayName?: string | null;
  username?: string;
  avatarUrl?: string;
  bio?: string | null;
  accountType?: "personal" | "brand" | "creator";
  privacy?: { isPrivateAccount?: boolean };
};

/** Reuse the same response shape as getUser */
export type SetUserResponse = GetUserResponse;

/**
 * PUT /v1/users/set/:userId
 * Default auth policy = "required" (enforced in http.ts)
 * Mark `auth: "none"` here only if you want this public.
 */
export const setUserEndpoint: EndpointDefinition<
  SetUserPayload,
  SetUserResponse
> = {
  key: "users.set",
  method: "PUT",
  pathTemplate: "/v1/users/set/:userId",

  // --- mock for create/update ---
  mock: async ({ pathParameters, body /* headers */ }) => {
    await new Promise((r) => setTimeout(r, 150)); // small latency
    const userId = pathParameters.userId;

    // Try to load an existing mock user; otherwise synthesize a default.
    const current =
      getUserFromMockDb(userId) ??
      ({
        user: {
          uid: userId,
          email: `user+${userId}@example.com`,
          displayName: "New User",
          username: `user_${userId}`,
          avatarUrl: undefined,
          bio: null,
          accountType: "personal",
          privacy: { isPrivateAccount: false },
          counts: { posts: 0, following: 0, followers: 0 },
        },
      } as SetUserResponse);

    const nextEmail =
      body?.email !== undefined
        ? String(body.email).toLowerCase()
        : current.user.email;

    const updated: SetUserResponse = {
      user: {
        ...current.user,
        email: nextEmail,
        displayName: body?.displayName ?? current.user.displayName,
        username: body?.username ?? current.user.username,
        avatarUrl: body?.avatarUrl ?? current.user.avatarUrl,
        bio: body?.bio ?? current.user.bio,
        accountType: body?.accountType ?? current.user.accountType,
        privacy: body?.privacy ?? current.user?.privacy ?? { isPrivateAccount: false },
        counts: current.user.counts, // counts not modified by this endpoint
      },
    };

    setUserInMockDb(userId, updated);
    return updated;
  },
};
