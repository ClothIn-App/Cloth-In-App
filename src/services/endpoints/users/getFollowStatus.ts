// src/services/endpoints/users/getFollowStatus.ts
import type { EndpointDefinition } from "../../http";
import { getCurrentUser, getUserById } from "../../mockSessionUsers";

// In-memory state for follow relationships (for newly created follows)
const inMemoryFollows: Set<string> = new Set();
const inMemoryUnfollows: Set<string> = new Set();

export type GetFollowStatusResponse = {
  isFollowing: boolean;
};

export const getFollowStatusEndpoint: EndpointDefinition<undefined, GetFollowStatusResponse> = {
  key: "users.getFollowStatus",
  method: "GET",
  pathTemplate: "/v1/users/:userId/follow-status",
  auth: "required",
  mock: async ({ pathParameters }) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 200));

    const targetUserId = pathParameters.userId;
    const currentUser = getCurrentUser();

    if (!currentUser || !targetUserId) {
      return { isFollowing: false };
    }

    // Check static mock data and overlay in-memory mutations.
    const followingIds = currentUser.following?.userIds ?? [];
    const isFollowing = isFollowEdgeActive(
      currentUser.id,
      targetUserId,
      followingIds.includes(targetUserId)
    );

    return { isFollowing };
  },
};

// Export functions to manage in-memory state (used by follow/unfollow endpoints)
export function addInMemoryFollow(currentUserId: string, targetUserId: string) {
  const followKey = `${currentUserId}:${targetUserId}`;
  inMemoryFollows.add(followKey);
  inMemoryUnfollows.delete(followKey);
}

export function addInMemoryUnfollow(currentUserId: string, targetUserId: string) {
  const followKey = `${currentUserId}:${targetUserId}`;
  inMemoryUnfollows.add(followKey);
  inMemoryFollows.delete(followKey);
}

export function isFollowEdgeActive(
  followerId: string,
  targetUserId: string,
  staticIsFollowing: boolean
): boolean {
  const followKey = `${followerId}:${targetUserId}`;
  if (inMemoryUnfollows.has(followKey)) return false;
  if (inMemoryFollows.has(followKey)) return true;
  return staticIsFollowing;
}

export function getInMemoryFollowKeys(): string[] {
  return Array.from(inMemoryFollows);
}
