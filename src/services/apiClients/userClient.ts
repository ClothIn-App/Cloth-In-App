import { getUserEndpoint, type GetUserResponse } from "../endpoints/users/getUser";
import { callApiEndpoint } from "../http";

// function-style
export async function getUser(userId: string) {
  return callApiEndpoint<undefined, GetUserResponse>(getUserEndpoint, {
    pathParameters: { userId },
  });
}

// object-style
export const userApiClient = { getUser };

export type { GetUserResponse };

