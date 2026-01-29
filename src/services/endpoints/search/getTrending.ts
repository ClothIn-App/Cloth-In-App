import type { EndpointDefinition } from "../../http";
import type { SearchSuggestion } from "../../../types/search";

export const getTrendingSearchesEndpoint: EndpointDefinition<
  undefined,
  SearchSuggestion[]
> = {
  key: "search.trending",
  method: "GET",
  pathTemplate: "/v1/search/trending",
  auth: "optional",
  mock: async () => {
    // Keep behavior aligned with existing mockSearch.getTrending
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Load mock data dynamically
    const trendingSearchesData = (await import("../../../mocks/trendingSearches.json")).default;

    return trendingSearchesData.map((text, index) => ({
      id: `trending-${index}`,
      text,
      type: "trending" as const,
      count: Math.floor(Math.random() * 10000) + 1000,
    }));
  },
};

import type { EndpointDefinition } from "../../http";
import type { SearchSuggestion } from "../../../types/search";

export type GetTrendingRequest = {
  limit?: number;
};

export type GetTrendingResponse = {
  trending: SearchSuggestion[];
};

export const getTrendingEndpoint: EndpointDefinition<
  GetTrendingRequest,
  GetTrendingResponse
> = {
  key: "search.trending",
  method: "GET",
  pathTemplate: "/v1/search/trending",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 300));

    const limit = Number(queryParameters.limit) || 10;
    const data = (await import("../../../mocks/trendingSearches.json")).default;

    const trending = (data as string[])
      .slice(0, limit)
      .map((text, index) => ({
        id: `trending-${index}`,
        text,
        type: "trending" as const,
        count: Math.floor(Math.random() * 1000) + 100,
      }));

    return { trending };
  },
};

