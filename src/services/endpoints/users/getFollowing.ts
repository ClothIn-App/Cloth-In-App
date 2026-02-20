// src/services/endpoints/users/getFollowing.ts
import type { EndpointDefinition } from "../../http";
import type { FollowingUser } from "../../../types/account";
import { getCurrentUser, getUserById } from "../../mockSessionUsers";

export type GetFollowingResponse = {
  following: FollowingUser[];
};

export const getFollowingEndpoint: EndpointDefinition<undefined, GetFollowingResponse> = {
  key: "users.getFollowing",
  method: "GET",
  pathTemplate: "/v1/users/:userId/following",
  auth: "optional",
  mock: async ({ pathParameters }) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 200));

    const userId = pathParameters.userId;
    if (!userId) {
      return { following: [] };
    }

    const profileUser = getUserById(userId);
    if (!profileUser) {
      return { following: [] };
    }

    const followingIds = profileUser.following?.userIds ?? [];
    const currentUser = getCurrentUser();
    const currentUserFollowingIds = new Set(
      currentUser?.following?.userIds ?? []
    );

    const following: FollowingUser[] = followingIds
      .map((followingId): FollowingUser | null => {
        const user = getUserById(followingId);
        if (!user) return null;

        return {
          uid: user.id,
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          isFollowing: currentUserFollowingIds.has(user.id),
          isPrivateAccount: !!user.privacy?.isPrivateAccount,
        };
      })
      .filter((u): u is FollowingUser => u !== null);

    return { following };
  },
};

