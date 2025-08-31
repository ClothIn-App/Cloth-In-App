import { callApiEndpoint } from "../http";
import {
  getUserEndpoint,
  GetUserResponse,
  setUserEndpoint,
  SetUserPayload,
  SetUserResponse,
} from '../../../src/services/endpoints'

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

// object-style
export const userApiClient = { getUser };

export type { GetUserResponse };

