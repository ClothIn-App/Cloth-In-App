/**
 * Search Data Layer
 * Facade over search EndpointDefinitions so callers don't need to know
 * about http.ts or endpoint wiring. In mock mode, the endpoints use
 * the same logic as the existing search modules.
 */

import { callApiEndpoint } from "./http";
import type {
  SearchSuggestion,
  UserSearchResult,
  FitPicSearchResult,
  ProductSearchResult,
  HashtagSearchResult,
} from "../types/search";
import type {
  SearchTopResponse,
  CategorySearchResponse,
  UserSearchFilters,
  FitPicSearchFilters,
  ProductSearchFilters,
  HashtagSearchFilters,
  UserSortBy,
  FitPicSortBy,
  ProductSortBy,
  HashtagSortBy,
} from "./search/types";
import {
  getTrendingSearchesEndpoint,
  getSearchSuggestionsEndpoint,
  searchTopEndpoint,
  searchUsersEndpoint,
  searchFitPicsEndpoint,
  searchProductsEndpoint,
  searchHashtagsEndpoint,
} from "./endpoints";

// Re-export types
export type { RecentSearchItem } from "./search/recentsStorage";
export type {
  SearchTopResponse,
  CategorySearchResponse,
  UserSearchFilters,
  FitPicSearchFilters,
  ProductSearchFilters,
  HashtagSearchFilters,
  UserSortBy,
  FitPicSortBy,
  ProductSortBy,
  HashtagSortBy,
} from "./search/types";

// Re-export dev config and recents helpers for callers that need them
export { DEV_SIMULATE_ERROR } from "./search/devConfig";
export { getRecents, addRecent, clearRecents } from "./search/recentsStorage";

// -------- Basic search entry points (top/suggestions/trending) --------

export async function getTrending(): Promise<SearchSuggestion[]> {
  return callApiEndpoint(getTrendingSearchesEndpoint);
}

export async function getSuggestions(
  q: string
): Promise<SearchSuggestion[]> {
  return callApiEndpoint(getSearchSuggestionsEndpoint, {
    queryParameters: { q },
  });
}

export async function searchTop(q: string): Promise<SearchTopResponse> {
  return callApiEndpoint(searchTopEndpoint, {
    queryParameters: { q },
  });
}

// ---------------- Category-specific search functions ----------------

export async function searchUsers(
  q: string,
  filters: UserSearchFilters = {},
  sortBy: UserSortBy = "relevance",
  cursor: string | null = null
): Promise<CategorySearchResponse<UserSearchResult>> {
  // For now, only q / cursor / sortBy are plumbed through query params.
  // Filters remain internal to the mock implementation.
  const raw = await callApiEndpoint(searchUsersEndpoint, {
    queryParameters: {
      q,
      cursor: cursor ?? undefined,
      sortBy,
    },
  });

  // New endpoint implementations may return either:
  // - CategorySearchResponse<UserSearchResult>
  // - or a simple { users, pagination } shape.
  if (raw && "items" in (raw as any)) {
    return raw as CategorySearchResponse<UserSearchResult>;
  }

  const users = (raw as any)?.users ?? [];
  const pagination = (raw as any)?.pagination ?? {};

  return {
    items: users,
    totalEstimate:
      typeof pagination.totalEstimate === "number"
        ? pagination.totalEstimate
        : users.length,
    nextCursor:
      typeof pagination.nextCursor === "string" ? pagination.nextCursor : null,
    hasMore: !!pagination.hasMore,
    searchTime: (raw as any)?.searchTime,
    query: q,
  };
}

export async function searchFitPics(
  q: string,
  filters: FitPicSearchFilters = {},
  sortBy: FitPicSortBy = "relevance",
  cursor: string | null = null
): Promise<CategorySearchResponse<FitPicSearchResult>> {
  const raw = await callApiEndpoint(searchFitPicsEndpoint, {
    queryParameters: {
      q,
      cursor: cursor ?? undefined,
      sortBy,
    },
  });

  if (raw && "items" in (raw as any)) {
    return raw as CategorySearchResponse<FitPicSearchResult>;
  }

  const fitpics = (raw as any)?.fitpics ?? [];
  const pagination = (raw as any)?.pagination ?? {};

  return {
    items: fitpics,
    totalEstimate:
      typeof pagination.totalEstimate === "number"
        ? pagination.totalEstimate
        : fitpics.length,
    nextCursor:
      typeof pagination.nextCursor === "string" ? pagination.nextCursor : null,
    hasMore: !!pagination.hasMore,
    searchTime: (raw as any)?.searchTime,
    query: q,
  };
}

export async function searchProducts(
  q: string,
  filters: ProductSearchFilters = {},
  sortBy: ProductSortBy = "relevance",
  cursor: string | null = null
): Promise<CategorySearchResponse<ProductSearchResult>> {
  const raw = await callApiEndpoint(searchProductsEndpoint, {
    queryParameters: {
      q,
      cursor: cursor ?? undefined,
      sortBy,
    },
  });

  if (raw && "items" in (raw as any)) {
    return raw as CategorySearchResponse<ProductSearchResult>;
  }

  const products = (raw as any)?.products ?? [];
  const pagination = (raw as any)?.pagination ?? {};

  return {
    items: products,
    totalEstimate:
      typeof pagination.totalEstimate === "number"
        ? pagination.totalEstimate
        : products.length,
    nextCursor:
      typeof pagination.nextCursor === "string"
        ? pagination.nextCursor
        : null,
    hasMore: !!pagination.hasMore,
    searchTime: (raw as any)?.searchTime,
    query: q,
  };
}

export async function searchHashtags(
  q: string,
  filters: HashtagSearchFilters = {},
  sortBy: HashtagSortBy = "relevance",
  cursor: string | null = null
): Promise<CategorySearchResponse<HashtagSearchResult>> {
  return callApiEndpoint(searchHashtagsEndpoint, {
    queryParameters: {
      q,
      cursor: cursor ?? undefined,
      sortBy,
    },
  });
}
