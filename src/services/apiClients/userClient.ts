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

// object-style
export const userApiClient = { getUser, setUser, getFollowers, getFollowing };

export type { GetUserResponse, GetFollowersResponse, GetFollowingResponse };

