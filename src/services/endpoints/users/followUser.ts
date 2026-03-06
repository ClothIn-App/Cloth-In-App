// src/services/endpoints/users/followUser.ts
import type { EndpointDefinition } from "../../http";
import { getCurrentUserId, getUserById } from "../../mockSessionUsers";
import { addInMemoryFollow } from "./getFollowStatus";

export type FollowUserResponse = {
  success: boolean;
  message?: string;
};

export const followUserEndpoint: EndpointDefinition<undefined, FollowUserResponse> = {
  key: "users.follow",
  method: "POST",
  pathTemplate: "/v1/users/:userId/follow",
  auth: "required",
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

    // Don't allow following yourself
    if (targetUserId === currentUserId) {
      return { success: false, message: "Cannot follow yourself" };
    }

    // Add to in-memory state
    addInMemoryFollow(currentUserId, targetUserId);

    return { success: true };
  },
};
