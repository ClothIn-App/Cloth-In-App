import type { GetNotificationsResponse } from "../../../types/notification";
import type { EndpointDefinition } from "../../http";

export type GetNotificationsRequest = {
  limit?: number;
  cursor?: string;
};

export const getNotificationsEndpoint: EndpointDefinition<
  GetNotificationsRequest,
  GetNotificationsResponse
> = {
  key: "notifications.get",
  method: "GET",
  pathTemplate: "/v1/notifications",
  auth: "required",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 200));
    const limit = Number(queryParameters.limit) || 20;
    const now = new Date().toISOString();

    const rows = [
      {
        id: "n-1",
        userId: "u-self",
        actorUserId: "u-actor-1",
        actorUsername: "stylefriend",
        actorAvatarUrl: null,
        type: "follow" as const,
        entityType: "user" as const,
        entityId: "u-actor-1",
        message: null,
        isRead: false,
        createdAt: now,
      },
      {
        id: "n-2",
        userId: "u-self",
        actorUserId: "u-actor-2",
        actorUsername: "fitcheck",
        actorAvatarUrl: null,
        type: "fitpic_like" as const,
        entityType: "fitpic" as const,
        entityId: "fitpic-2",
        message: null,
        isRead: false,
        createdAt: now,
      },
    ];

    return {
      success: true,
      notifications: rows.slice(0, limit),
      pagination: {
        hasMore: false,
      },
    };
  },
};
