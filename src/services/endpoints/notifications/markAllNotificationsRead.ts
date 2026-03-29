import type { MarkAllNotificationsReadResponse } from "../../../types/notification";
import type { EndpointDefinition } from "../../http";

export type MarkAllNotificationsReadRequest = Record<string, never>;

export const markAllNotificationsReadEndpoint: EndpointDefinition<
  MarkAllNotificationsReadRequest,
  MarkAllNotificationsReadResponse
> = {
  key: "notifications.markAllRead",
  method: "POST",
  pathTemplate: "/v1/notifications/read-all",
  auth: "required",
  mock: async () => {
    await new Promise((r) => setTimeout(r, 100));
    return { success: true, updated: 0 };
  },
};
