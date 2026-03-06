import type { ProfileCounts } from "../../../types/account";
import type { EndpointDefinition } from "../../http";
import { getCurrentUserId, getUserById } from "../../mockSessionUsers";
import { getInMemoryFollowKeys } from "../users/getFollowStatus";

export type GetProfileCountsResponse = ProfileCounts;

export const getProfileCountsEndpoint: EndpointDefinition<
  undefined,
  GetProfileCountsResponse
> = {
  key: "profile.getCounts",
  method: "GET",
  pathTemplate: "/v1/profile/counts",
  auth: "optional",
  mock: async ({ queryParameters }): Promise<GetProfileCountsResponse> => {
    const userId = queryParameters.userId ?? getCurrentUserId();
    if (userId) {
      const raw = getUserById(userId);
      if (!raw) {
        return { posts: 0, followers: 0, following: 0 };
      }
      let followers = raw.followers?.total ?? 0;
      let following = raw.following?.total ?? 0;
      for (const key of getInMemoryFollowKeys()) {
        const [followerId, targetId] = key.split(":");
        if (followerId === userId) following += 1;
        if (targetId === userId) followers += 1;
      }
      return {
        posts: raw.fitpics?.total ?? 0,
        followers,
        following,
      };
    }
    return (await import("../../../mocks/profile/counts.json"))
      .default as GetProfileCountsResponse;
  },
};
