// src/services/endpoints/users/unfollowUser.ts
import type { EndpointDefinition } from "../../http";
import { getCurrentUserId, getUserById } from "../../mockSessionUsers";
import { addInMemoryUnfollow } from "./getFollowStatus";

export type UnfollowUserResponse = {
  success: boolean;
  message?: string;
};

export const unfollowUserEndpoint: EndpointDefinition<undefined, UnfollowUserResponse> = {
  key: "users.unfollow",
  method: "POST",
  pathTemplate: "/v1/users/:userId/unfollow",
  auth: "optional",
  mock: async ({ pathParameters }) => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 300));

    const targetUserId = pathParameters.userId;
    const currentUserId = getCurrentUserId();

    if (!targetUserId || !currentUserId) {
      return { success: false, message: "Missing user ID" };
    }

    // Check if target user exists
    const targetUser = getUserById(targetUserId);
    if (!targetUser) {
      return { success: false, message: "User not found" };
    }

    // Add to in-memory state
    addInMemoryUnfollow(currentUserId, targetUserId);

    return { success: true };
  },
};
