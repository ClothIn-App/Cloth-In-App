import type { EndpointDefinition } from "../../http";
import type {
  CategorySearchResponse,
  HashtagSearchFilters,
  HashtagSortBy,
} from "../../search/types";
import type { HashtagSearchResult } from "../../../types/search";
import { searchHashtags as searchHashtagsImpl } from "../../search/hashtagSearch";

export type SearchHashtagsRequest = {
  q: string;
  cursor?: string | null;
  sortBy?: HashtagSortBy;
};

export const searchHashtagsEndpoint: EndpointDefinition<
  undefined,
  CategorySearchResponse<HashtagSearchResult>
> = {
  key: "search.hashtags",
  method: "GET",
  pathTemplate: "/v1/search/hashtags",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    const q = queryParameters.q ?? "";
    const cursor = queryParameters.cursor ?? null;
    const sortBy =
      (queryParameters.sortBy as HashtagSortBy | undefined) ?? "relevance";

    const filters: HashtagSearchFilters = {};

    // Load mock data dynamically
    const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;

    // Call pure function with loaded data
    return searchHashtagsImpl(fitpicsData.fitpics, q, filters, sortBy, cursor);
  },
};


