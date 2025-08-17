// src/services/endpoints/users/getUser.ts
import type { EndpointDefinition } from "../../http";

export type GetUserResponse = {
  user: {
    uid: string;
    email: string;
    displayName?: string | null;
  };
};

export const getUserEndpoint: EndpointDefinition<undefined, GetUserResponse> = {
  key: "users.get",
  method: "GET",
  pathTemplate: "/v1/users/get/:userId",
  mock: async ({ pathParameters, headers }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!headers.Authorization) {
      // Simulate a protected endpoint
      throw new Error("Unauthorized");
    }
    const userId = pathParameters.userId;
    return {
      user: {
        uid: userId,
        email: `user+${userId}@example.com`.toLowerCase(),
        displayName: "Mocked User",
      },
    };
  },
};
