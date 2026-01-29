import type { EndpointDefinition } from "../../http";
import type { UserSearchResult } from "../../../types/search";
import { filterUsers } from "../../search/filterUtils";

export type SearchUsersRequest = {
  q?: string;
  sortBy?: "relevance" | "newest" | "most_followers";
  limit?: number;
  cursor?: string;
};

export type SearchUsersResponse = {
  users: UserSearchResult[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const searchUsersEndpoint: EndpointDefinition<
  SearchUsersRequest,
  SearchUsersResponse
> = {
  key: "search.users",
  method: "GET",
  pathTemplate: "/v1/search/users",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const q = (queryParameters.q as string)?.trim() || "";

    // Load mock data dynamically
    const usersData = (await import("../../../mocks/mock-users.json")).default;
    const usersArray = Object.values(usersData as Record<string, any>);

    // Use shared filtering function with loaded data
    const users = filterUsers(usersArray, q);

    // Apply sorting
    const sortBy = (queryParameters.sortBy as string) || "relevance";
    if (sortBy === "most_followers") {
      users.sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0));
    } else if (sortBy === "newest") {
      // Mock: assume first users are newest
      users.reverse();
    }

    // Apply pagination
    const limit = Number(queryParameters.limit) || 20;
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      pagination: {
        hasMore: endIndex < users.length,
        nextCursor: endIndex < users.length ? endIndex.toString() : undefined,
      },
    };
  },
};

