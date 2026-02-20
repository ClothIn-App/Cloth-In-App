// src/services/endpoints/users/getFollowers.ts
import type { EndpointDefinition } from "../../http";
import type { FollowerUser } from "../../../types/account";
import { getCurrentUser, getUserById } from "../../mockSessionUsers";

export type GetFollowersResponse = {
  followers: FollowerUser[];
};

export const getFollowersEndpoint: EndpointDefinition<undefined, GetFollowersResponse> = {
  key: "users.getFollowers",
  method: "GET",
  pathTemplate: "/v1/users/:userId/followers",
  auth: "optional",
  mock: async ({ pathParameters }) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 200));

    const userId = pathParameters.userId;
    if (!userId) {
      return { followers: [] };
    }

    const profileUser = getUserById(userId);
    if (!profileUser) {
      return { followers: [] };
    }

    const followerIds = profileUser.followers?.userIds ?? [];
    const currentUser = getCurrentUser();
    const currentUserFollowingIds = new Set(
      currentUser?.following?.userIds ?? []
    );

    const followers: FollowerUser[] = followerIds
      .map((followerId): FollowerUser | null => {
        const user = getUserById(followerId);
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
      .filter((u): u is FollowerUser => u !== null);

    return { followers };
  },
};

