import type { ProfileMe } from "../../../types/account";

const endpoint = {
  key: "profile.getMe",
  method: "GET",
  pathTemplate: "/v1/profile/me",
  mock: async (): Promise<ProfileMe> =>
    (await import("../../../mocks/profile/me.json")).default as ProfileMe,
} as const;

export default endpoint;
