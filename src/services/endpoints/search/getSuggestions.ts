import type { EndpointDefinition } from "../../http";
import type { SearchSuggestion } from "../../../types/search";
import { getRecents } from "../../search/recentsStorage";

export type GetSuggestionsRequest = {
  q?: string;
  limit?: number;
};

export type GetSuggestionsResponse = {
  suggestions: SearchSuggestion[];
};

export const getSuggestionsEndpoint: EndpointDefinition<
  GetSuggestionsRequest,
  GetSuggestionsResponse
> = {
  key: "search.suggestions",
  method: "GET",
  pathTemplate: "/v1/search/suggestions",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 300));

    const q = (queryParameters.q as string)?.toLowerCase().trim() || "";
    const limit = Number(queryParameters.limit) || 10;

    // Load data sources
    const [textSuggestionsData, trendingSearchesData] = await Promise.all([
      import("../../../mocks/searchSuggestions.json"),
      import("../../../mocks/trendingSearches.json"),
    ]);

    // Handle both formats: array of strings OR array of objects
    const searchSuggestionsData = textSuggestionsData.default as any[];
    const trendingSearchesDataArray = trendingSearchesData.default as string[];

    // If query is empty, return recent searches (matching fe-search-pages behavior)
    if (!q) {
      const recents = await getRecents();
      return {
        suggestions: recents
          .filter((item) => item.type === "query")
          .slice(0, 5)
          .map((item) => ({
            id: `recent-${item.text}`,
            text: item.text,
            type: "recent" as const,
          })),
      };
    }

    const queryLower = q.toLowerCase();
    const allSuggestions: SearchSuggestion[] = [];

    // 1. Priority: Recent searches matching query
    const recents = await getRecents();
    const recentMatches = recents
      .filter((item) => {
        if (item.type === "query") {
          return item.text.toLowerCase().includes(queryLower);
        }
        if (item.type === "user") {
          return (
            item.username.toLowerCase().includes(queryLower) ||
            item.displayName?.toLowerCase().includes(queryLower)
          );
        }
        if (item.type === "product") {
          return (
            item.name.toLowerCase().includes(queryLower) ||
            item.brand?.toLowerCase().includes(queryLower)
          );
        }
        return false;
      })
      .slice(0, 3)
      .map((item) => {
        if (item.type === "query") {
          return {
            id: `recent-${item.text}`,
            text: item.text,
            type: "recent" as const,
          };
        }
        if (item.type === "user") {
          return {
            id: `recent-user-${item.uid}`,
            text: item.displayName || item.username,
            type: "recent" as const,
            category: "users" as const,
          };
        }
        if (item.type === "product") {
          return {
            id: `recent-product-${item.id}`,
            text: item.name,
            type: "recent" as const,
            category: "products" as const,
          };
        }
        return null;
      })
      .filter((item): item is SearchSuggestion => item !== null);

    allSuggestions.push(...recentMatches);

    // 2. Suggestions from mock data
    const suggestionMatches = searchSuggestionsData
      .filter((item: any) => {
        const text = typeof item === "string" ? item : (item.text || item);
        return text && text.toLowerCase().includes(queryLower);
      })
      .slice(0, 5)
      .map((item: any, index: number) => {
        // Handle both string array and object array formats
        if (typeof item === "string") {
          return {
            id: `suggestion-${index}`,
            text: item,
            type: "suggestion" as const,
          };
        }
        // Object format (from fe-search-pages)
        return {
          id: item.id || `suggestion-${index}`,
          text: item.text,
          type: "suggestion" as const,
          category: item.category,
        };
      });

    allSuggestions.push(...suggestionMatches);

    // 3. Trending searches matching query
    const trendingMatches = trendingSearchesDataArray
      .filter((text) => text.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map((text, index) => ({
        id: `trending-${index}`,
        text,
        type: "trending" as const,
        count: Math.floor(Math.random() * 10000) + 1000,
      }));

    allSuggestions.push(...trendingMatches);

    // Remove duplicates (by text, keeping priority order)
    const seen = new Set<string>();
    const deduped: SearchSuggestion[] = [];

    for (const suggestion of allSuggestions) {
      const key = suggestion.text.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(suggestion);
      }
    }

    return { suggestions: deduped.slice(0, limit) };
  },
};

