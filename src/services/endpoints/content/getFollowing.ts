import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";
import { transformRawFitPic } from "../../fitpicUtils";

// ── Server response types ─────────────────────────────────────────────────
// Mirrors app/models/feed.py (FitPicFeedItem, GetFollowingResponse)
// in cloth-in-server.

export type FollowingFitPicItem = {
  type: "fitpic";
  fitpic: FitPic;
};

// ── Request / Response ────────────────────────────────────────────────────

export type GetFollowingRequest = {
  limit?: number;
  /** Opaque cursor from a previous response's pagination.nextCursor. */
  cursor?: string;
};

export type GetFollowingResponse = {
  items: FollowingFitPicItem[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  } | null;
};

// ── Endpoint definition ───────────────────────────────────────────────────

export const getFollowingEndpoint: EndpointDefinition<
  GetFollowingRequest,
  GetFollowingResponse
> = {
  key: "content.following",
  method: "GET",
  pathTemplate: "/v1/content/following",
  auth: "required",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 600));

    const [fitpicsModule, usersModule] = await Promise.all([
      import("../../../mocks/mock-fitpics.json"),
      import("../../../mocks/mock-users.json"),
    ]);

    const rawFitpics = fitpicsModule.default.fitpics;
    const usersData = usersModule.default;

    // Return fitpics in chronological order (newest first), no products.
    const allItems: FollowingFitPicItem[] = rawFitpics
      .slice()
      .sort((a: any, b: any) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )
      .reduce<FollowingFitPicItem[]>((acc, fp: any) => {
        const userData = usersData[fp.author as keyof typeof usersData];
        const transformed = transformRawFitPic(fp, userData, []);
        if (transformed) {
          acc.push({ type: "fitpic", fitpic: transformed });
        }
        return acc;
      }, []);

    const limit = Math.min(Number(queryParameters.limit) || 20, 100);
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + limit;

    return {
      items: allItems.slice(startIndex, endIndex),
      pagination:
        endIndex < allItems.length
          ? { hasMore: true, nextCursor: String(endIndex) }
          : null,
    };
  },
};
