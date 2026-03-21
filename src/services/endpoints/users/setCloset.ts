import type { EndpointDefinition } from "../../http";
import type { GetUserResponse } from "./getUser";
import { getUserFromMockDb, setUserInMockDb } from "./mockDb";

export type ClosetRackPayload = {
  id: string;
  name: string;
  productIds: string[];
  createdAt?: number;
};

export type SetClosetPayload = {
  base: { productIds: string[] };
  racks: ClosetRackPayload[];
};

/** Reuse the same response shape as getUser */
export type SetClosetResponse = GetUserResponse;

/**
 * PUT /v1/users/:userId/closet
 * Updates the authenticated user's closet (base productIds + racks).
 */
export const setClosetEndpoint: EndpointDefinition<
  SetClosetPayload,
  SetClosetResponse
> = {
  key: "users.setCloset",
  method: "PUT",
  pathTemplate: "/v1/users/:userId/closet",

  mock: async ({ pathParameters, body }) => {
    await new Promise((r) => setTimeout(r, 150));
    const userId = pathParameters.userId;
    const current = getUserFromMockDb(userId);
    if (!current?.user) {
      return { user: null };
    }
    const updated: SetClosetResponse = {
      user: {
        ...current.user,
        closet: body ?? { base: { productIds: [] }, racks: [] },
      },
    };
    setUserInMockDb(userId, updated);
    return updated;
  },
};
