import type { ProfileCounts } from "../../../types/account";

const endpoint = {
  key: "profile.getCounts",
  method: "GET",
  pathTemplate: "/v1/profile/counts",
  mock: async (): Promise<ProfileCounts> =>
    (await import("../../../mocks/profile/counts.json")).default as ProfileCounts,
} as const;

export default endpoint;
