import type { EndpointDefinition } from "../../http";
import type { FitPicSearchResult } from "../../../types/search";
import { filterFitPics } from "../../search/filterUtils";

export type SearchFitPicsRequest = {
  q?: string;
  sortBy?: "relevance" | "newest" | "most_liked" | "most_saved";
  limit?: number;
  cursor?: string;
  userId?: string;
};

export type SearchFitPicsResponse = {
  fitpics: FitPicSearchResult[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const searchFitPicsEndpoint: EndpointDefinition<
  SearchFitPicsRequest,
  SearchFitPicsResponse
> = {
  key: "search.fitpics",
  method: "GET",
  pathTemplate: "/v1/search/fitpics",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const q = (queryParameters.q as string)?.trim() || "";
    const userId = queryParameters.userId as string | undefined;

    // Load mock data dynamically
    const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;
    const productsData = (await import("../../../mocks/mock-products.json")).default;

    // Use shared filtering function with loaded data
    let fitpics = filterFitPics(fitpicsData.fitpics, productsData.products, q, userId);

    // Apply sorting
    const sortBy = (queryParameters.sortBy as string) || "relevance";
    if (sortBy === "newest") {
      fitpics.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "most_liked") {
      fitpics.sort((a, b) => b.engagement.likes - a.engagement.likes);
    } else if (sortBy === "most_saved") {
      fitpics.sort((a, b) => b.engagement.saves - a.engagement.saves);
    }

    // Apply pagination
    const limit = Number(queryParameters.limit) || 20;
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedFitPics = fitpics.slice(startIndex, endIndex);

    return {
      fitpics: paginatedFitPics,
      pagination: {
        hasMore: endIndex < fitpics.length,
        nextCursor: endIndex < fitpics.length ? endIndex.toString() : undefined,
      },
    };
  },
};

