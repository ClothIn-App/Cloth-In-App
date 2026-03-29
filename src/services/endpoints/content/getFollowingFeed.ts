import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";
import { getCurrentUserId, getUserById } from "../../mockSessionUsers";
import { transformRawFitPic } from "../../fitpicUtils";

// ── Response type ─────────────────────────────────────────────────────────────
// Mirrors the backend GET /v1/content/following-feed response shape.

export type FollowingFeedResponse = {
  items: FitPic[];
  nextCursor: string | null;
  hasMore: boolean;
};

// ── Endpoint definition ───────────────────────────────────────────────────────

export const getFollowingFeedEndpoint: EndpointDefinition<
  Record<string, never>,
  FollowingFeedResponse
> = {
  key: "content.followingFeed",
  method: "GET",
  pathTemplate: "/v1/content/following-feed",
  auth: "required",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 600));

    const limit = Math.min(Number(queryParameters.limit) || 20, 100);
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + limit;

    const [fitpicsModule, productsModule, usersModule] = await Promise.all([
      import("../../../mocks/mock-fitpics.json"),
      import("../../../mocks/mock-products.json"),
      import("../../../mocks/mock-users.json"),
    ]);

    const rawFitpics = fitpicsModule.default.fitpics;
    const rawProducts = productsModule.default.products;
    const usersData = usersModule.default;

    // Filter to only fitpics from users the current user follows.
    const currentUserId = getCurrentUserId();
    const currentUser = getUserById(currentUserId);
    const followingIds = new Set(currentUser?.following?.userIds ?? []);

    const filtered = rawFitpics.filter((fp: any) => followingIds.has(fp.author));
    const page = filtered.slice(startIndex, endIndex);

    const items: FitPic[] = page
      .map((fp: any) => {
        const userData = usersData[fp.author as keyof typeof usersData];
        return transformRawFitPic(fp, userData, rawProducts as any[]);
      })
      .filter((f): f is FitPic => f != null);

    return {
      items,
      nextCursor: endIndex < filtered.length ? String(endIndex) : null,
      hasMore: endIndex < filtered.length,
    };
  },
};
