import { callApiEndpoint } from "../http";
import {
  getUserEndpoint,
  GetUserResponse,
  setUserEndpoint,
  SetUserPayload,
  SetUserResponse,
  getFollowersEndpoint,
  GetFollowersResponse,
  getFollowingEndpoint,
  GetFollowingResponse,
  getFollowStatusEndpoint,
  GetFollowStatusResponse,
  followUserEndpoint,
  FollowUserResponse,
  unfollowUserEndpoint,
  UnfollowUserResponse,
  getProfileCountsEndpoint,
  GetProfileCountsResponse,
  deleteMeEndpoint,
  DeleteAccountResponse,
} from '../endpoints'

// function-style
export async function getUser(userId: string) {
  return callApiEndpoint<undefined, GetUserResponse>(getUserEndpoint, {
    pathParameters: { userId },
  });
}

export async function setUser(userId: string, payload: SetUserPayload) {
  return callApiEndpoint<SetUserPayload, SetUserResponse>(setUserEndpoint, {
    pathParameters: { userId },
    requestBody: payload,
  });
}

export async function getFollowers(userId: string, options?: { limit?: number; cursor?: string }) {
  return callApiEndpoint<undefined, GetFollowersResponse>(getFollowersEndpoint, {
    pathParameters: { userId },
    queryParameters: options,
  });
}

export async function getFollowing(userId: string, options?: { limit?: number; cursor?: string }) {
  return callApiEndpoint<undefined, GetFollowingResponse>(getFollowingEndpoint, {
    pathParameters: { userId },
    queryParameters: options,
  });
}

export async function getFollowStatus(userId: string) {
  return callApiEndpoint<undefined, GetFollowStatusResponse>(getFollowStatusEndpoint, {
    pathParameters: { userId },
  });
}

export async function followUser(userId: string) {
  const result = await callApiEndpoint<undefined, FollowUserResponse>(followUserEndpoint, {
    pathParameters: { userId },
  });
  if (!result.success) {
    throw new Error(result.message ?? "Couldn't follow user.");
  }
  return result;
}

export async function unfollowUser(userId: string) {
  const result = await callApiEndpoint<undefined, UnfollowUserResponse>(unfollowUserEndpoint, {
    pathParameters: { userId },
  });
  if (!result.success) {
    throw new Error(result.message ?? "Couldn't unfollow user.");
  }
  return result;
}

export async function getProfileCounts(userId?: string) {
  return callApiEndpoint<undefined, GetProfileCountsResponse>(getProfileCountsEndpoint, {
    queryParameters: userId ? { userId } : undefined,
  });
}

export async function deleteMe() {
  return callApiEndpoint<undefined, DeleteAccountResponse>(deleteMeEndpoint, {});
}

// object-style
export const userApiClient = { 
  getUser, 
  setUser, 
  getFollowers, 
  getFollowing,
  getFollowStatus,
  followUser,
  unfollowUser,
  getProfileCounts,
  deleteMe,
};

export type {
  GetUserResponse,
  GetFollowersResponse,
  GetFollowingResponse,
  GetFollowStatusResponse,
  FollowUserResponse,
  UnfollowUserResponse,
  GetProfileCountsResponse,
  DeleteAccountResponse,
};

