import type { ProfileTabs } from "../../../types/account";

const endpoint = {
  key: "profile.getTabs",
  method: "GET",
  pathTemplate: "/v1/profile/tabs",
  mock: async (): Promise<ProfileTabs> =>
    (await import("../../../mocks/profile/tabs.json")).default as ProfileTabs,
} as const;

export default endpoint;
