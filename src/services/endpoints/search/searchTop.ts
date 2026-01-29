import type { EndpointDefinition } from "../../http";
import type { SearchTopResponse } from "../../search/types";
import type {
  SearchSuggestion,
  SearchResult,
  HashtagSearchResult,
} from "../../../types/search";
import { DEV_SIMULATE_ERROR } from "../../search/devConfig";
import { filterFitPics, filterUsers, filterProducts } from "../../search/filterUtils";

export const searchTopEndpoint: EndpointDefinition<undefined, SearchTopResponse> =
  {
    key: "search.top",
    method: "GET",
    pathTemplate: "/v1/search/top",
    auth: "optional",
    mock: async ({ queryParameters }) => {
      const q = (queryParameters.q ?? "").trim();

      if (DEV_SIMULATE_ERROR === "error") {
        await new Promise((r) => setTimeout(r, 500));
        throw new Error("Failed to load search results");
      }
      if (DEV_SIMULATE_ERROR === "no-connection") {
        await new Promise((r) => setTimeout(r, 500));
        throw new Error("No internet connection");
      }

      await new Promise((r) => setTimeout(r, 500));

      const queryLower = q.toLowerCase();
      if (!queryLower || queryLower.length < 2) {
        const empty: SearchResult = {
          users: [],
          fitpics: [],
          products: [],
          hashtags: [],
        };
        return {
          results: empty,
          totalEstimate: 0,
          nextCursor: null,
        };
      }

      // Load mock data dynamically
      const fitpicsData = (await import("../../../mocks/mock-fitpics.json")).default;
      const productsData = (await import("../../../mocks/mock-products.json")).default;
      const usersData = (await import("../../../mocks/mock-users.json")).default;

      // Convert usersData object to array
      const usersArray = Object.values(usersData as Record<string, any>);

      // Use shared filtering functions with loaded data
      const users = filterUsers(usersArray, q);
      const fitpics = filterFitPics(fitpicsData.fitpics, productsData.products, q);
      const products = filterProducts(productsData.products, q);

      // Hashtags (from captions)
      const hashtagMap = new Map<string, number>();
      fitpicsData.fitpics.forEach((fitpic: any) => {
        if (fitpic.caption) {
          const hashtags = fitpic.caption.match(/#\w+/g) || [];
          hashtags.forEach((tag: string) => {
            const tagLower = tag.substring(1).toLowerCase();
            hashtagMap.set(
              tagLower,
              (hashtagMap.get(tagLower) || 0) + 1
            );
          });
        }
      });

      const hashtags: HashtagSearchResult[] = Array.from(
        hashtagMap.entries()
      )
        .filter(([tag]) => tag.includes(queryLower))
        .map(([tag, count]) => ({
          id: `hashtag-${tag}`,
          tag,
          postCount: count,
          isTrending: count >= 2,
          trendDirection:
            count >= 3
              ? ("up" as const)
              : count >= 2
              ? ("stable" as const)
              : undefined,
        }))
        .sort((a, b) => b.postCount - a.postCount);

      const limitedUsers = users.slice(0, 5);
      const limitedFitpics = fitpics.slice(0, 6);
      const limitedProducts = products.slice(0, 6);
      const limitedHashtags = hashtags.slice(0, 5);

      const totalEstimate =
        users.length +
        fitpics.length +
        products.length +
        hashtags.length;

      const hasMore =
        users.length > limitedUsers.length ||
        fitpics.length > limitedFitpics.length ||
        products.length > limitedProducts.length ||
        hashtags.length > limitedHashtags.length;

      const nextCursor = hasMore ? `cursor_${queryLower}_${Date.now()}` : null;

      if (totalEstimate === 0) {
        const empty: SearchResult = {
          users: [],
          fitpics: [],
          products: [],
          hashtags: [],
        };
        return {
          results: empty,
          totalEstimate: 0,
          nextCursor: null,
        };
      }

      const results: SearchResult = {
        users: limitedUsers,
        fitpics: limitedFitpics,
        products: limitedProducts,
        hashtags: limitedHashtags,
      };

      return {
        results,
        totalEstimate,
        nextCursor,
        categoryCounts: {
          users: users.length,
          fitpics: fitpics.length,
          products: products.length,
          hashtags: hashtags.length,
        },
      };
    },
  };


