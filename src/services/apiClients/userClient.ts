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

export async function getFollowers(userId: string) {
  return callApiEndpoint<undefined, GetFollowersResponse>(getFollowersEndpoint, {
    pathParameters: { userId },
  });
}

export async function getFollowing(userId: string) {
  return callApiEndpoint<undefined, GetFollowingResponse>(getFollowingEndpoint, {
    pathParameters: { userId },
  });
}

export async function getFollowStatus(userId: string) {
  return callApiEndpoint<undefined, GetFollowStatusResponse>(getFollowStatusEndpoint, {
    pathParameters: { userId },
  });
}

export async function followUser(userId: string) {
  return callApiEndpoint<undefined, FollowUserResponse>(followUserEndpoint, {
    pathParameters: { userId },
  });
}

export async function unfollowUser(userId: string) {
  return callApiEndpoint<undefined, UnfollowUserResponse>(unfollowUserEndpoint, {
    pathParameters: { userId },
  });
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
};

export type { GetUserResponse, GetFollowersResponse, GetFollowingResponse, GetFollowStatusResponse, FollowUserResponse, UnfollowUserResponse };

