// src/services/endpoints/users/getFollowing.ts
import type { EndpointDefinition } from "../../http";
import type { FollowingUser } from "../../../types/account";
import { getCurrentUser, getUserById } from "../../mockSessionUsers";
import { getInMemoryFollowKeys, isFollowEdgeActive } from "./getFollowStatus";

export type GetFollowingResponse = {
  following: FollowingUser[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
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
      return {
        following: [],
        pagination: { hasMore: false, nextCursor: null },
      };
    }

    const profileUser = getUserById(userId);
    if (!profileUser) {
      return {
        following: [],
        pagination: { hasMore: false, nextCursor: null },
      };
    }

    const staticFollowingIds = profileUser.following?.userIds ?? [];
    const followingIdSet = new Set(staticFollowingIds);
    for (const key of getInMemoryFollowKeys()) {
      const [followerId, targetId] = key.split(":");
      if (followerId === userId && targetId) {
        followingIdSet.add(targetId);
      }
    }
    const followingIds = Array.from(followingIdSet);
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
          isFollowing: isFollowEdgeActive(
            currentUser?.id ?? "",
            user.id,
            currentUserFollowingIds.has(user.id)
          ),
          isPrivateAccount: !!user.privacy?.isPrivateAccount,
        };
      })
      .filter((u): u is FollowingUser => u !== null);

    return {
      following,
      pagination: { hasMore: false, nextCursor: null },
    };
  },
};

