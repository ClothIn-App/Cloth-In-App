// src/services/endpoints/users/getUser.ts
import type { EndpointDefinition } from "../../http";
import { log } from "../../../debug/log";

export type GetUserResponse = {
  user: {
    uid: string;
    email: string;
    displayName?: string | null;
    username?: string;
    avatarUrl?: string;
    bio?: string | null;
    accountType?: string | null;
    counts?: {
      posts: number;
      following: number;
      followers: number;
    };
  };
};

export const getUserEndpoint: EndpointDefinition<undefined, GetUserResponse> = {
  key: "users.get",
  method: "GET",
  pathTemplate: "/v1/users/get/:userId",
  mock: async ({ pathParameters, headers }) => {
    // simulate latency
    await new Promise((r) => setTimeout(r, 200));

    const userId = pathParameters.userId;

    return {
      user: {
        uid: userId,
        email: `user+${userId}@example.com`.toLowerCase(),
        displayName: "Jane Doe",
        username: "janedoe",
        avatarUrl: "https://example.com/avatars/jane.png",
        bio: "Clothes & coffee.",
        //added account type - 8/24/25 (controls tabs shown on account page - constants/accountTabs.ts)
        accountType: "personal",
        counts: {
          posts: 12,
          following: 87,
          followers: 143,
        },
      },
    };
  },
};
