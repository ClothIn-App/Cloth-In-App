import type { EndpointDefinition } from "../../http";
import type { GetFeedRequest, GetFeedResponse, FitPic } from "../../../types/fitpic";
import { inMemoryFitpics } from "./createFitPic";
import { transformRawFitPic, sortFitPics, filterFitPics } from "../../fitpicUtils";

export const getFeedEndpoint: EndpointDefinition<
  GetFeedRequest,
  GetFeedResponse
> = {
  key: "fitpics.feed",
  method: "GET",
  pathTemplate: "/v1/fitpics/feed",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Load static JSON data
    const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;
    const usersData = (await import("../../../mocks/mock-users.json")).default;
    const productsData = (await import("../../../mocks/mock-products.json")).default;

    // Transform static fitpics
    const staticFitpics: FitPic[] = fitpicsData.fitpics
      .map((rawFitpic: any) => {
        const userData = usersData[rawFitpic.author as keyof typeof usersData];
        return transformRawFitPic(rawFitpic, userData, productsData.products);
      })
      .filter((fp): fp is FitPic => fp !== null);

    // Merge with in-memory fitpics (in-memory first for priority)
    let all: FitPic[] = [...inMemoryFitpics, ...staticFitpics];

    // Apply filters if provided
    const filters = queryParameters.filters ? JSON.parse(queryParameters.filters as string) : undefined;
    if (filters) {
      all = filterFitPics(all, filters);
    }

    // Apply sorting if provided
    const sort = queryParameters.sort as string | undefined;
    if (sort) {
      all = sortFitPics(all, sort as any);
    } else {
      // Default to newest first
      all = sortFitPics(all, 'newest');
    }

    const cursor = queryParameters.cursor;
    const limitParam = queryParameters.limit;
    const limit =
      typeof limitParam === "string" ? parseInt(limitParam, 10) || 20 : 20;

    const startIndex =
      typeof cursor === "string" && cursor.length
        ? parseInt(cursor, 10) || 0
        : 0;
    const endIndex = startIndex + limit;

    const page = all.slice(startIndex, endIndex);
    const hasMore = endIndex < all.length;

    const response: GetFeedResponse = {
      success: true,
      fitpics: page,
      pagination: {
        hasMore,
        nextCursor: hasMore ? String(endIndex) : undefined,
      },
    };

    return response;
  },
};


