import type { EndpointDefinition } from "../../http";
import type { GetFitPicsResponse, FitPic } from "../../../types/fitpic";
import { inMemoryFitpics } from "./createFitPic";
import { transformRawFitPic } from "../../fitpicUtils";

export const getFitPicsEndpoint: EndpointDefinition<undefined, GetFitPicsResponse> =
  {
    key: "fitpics.list",
    method: "GET",
    pathTemplate: "/v1/fitpics",
    auth: "optional",
    mock: async ({ queryParameters }) => {
      await new Promise((resolve) => setTimeout(resolve, 250));

      const userId = queryParameters.user_id;
      const cursor = queryParameters.cursor;
      const limitParam = queryParameters.limit;
      const limit =
        typeof limitParam === "string" ? parseInt(limitParam, 10) || 20 : 20;

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

      // Merge with in-memory fitpics
      let source: FitPic[] = [...inMemoryFitpics, ...staticFitpics];

      // Filter by user if provided
      if (userId) {
        // First try to get user's postedIds (if available in mock data)
        const userData = usersData[userId as keyof typeof usersData];
        const postedIds = userData?.fitpics?.postedIds;
        
        if (postedIds && Array.isArray(postedIds) && postedIds.length > 0) {
          // Filter by postedIds (matches existing mock data structure)
          source = source.filter((fp) => postedIds.includes(fp.id));
        } else {
          // Fallback to filtering by authorId (standard API behavior)
          source = source.filter((fp) => fp.authorId === userId);
        }
      }

      const startIndex =
        typeof cursor === "string" && cursor.length
          ? parseInt(cursor, 10) || 0
          : 0;
      const endIndex = startIndex + limit;

      const page = source.slice(startIndex, endIndex);
      const hasMore = endIndex < source.length;

      const response: GetFitPicsResponse = {
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


