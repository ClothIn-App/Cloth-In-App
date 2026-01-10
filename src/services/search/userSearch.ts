/**
 * User search implementation
 * Handles searching for users with filtering, sorting, and pagination
 */

import type { UserSearchResult } from '../../types/search';
import type {
  CategorySearchResponse,
  UserSearchFilters,
  UserSortBy,
} from './types';
import { filterUsers, sortUsers } from './filters';
import { calculateRelevanceScore } from './relevance';
import { calculatePagination } from './pagination';
import { validateQuery, simulateError, simulateNetworkDelay, createEmptyResponse, applyRelevanceSorting } from './searchUtils';
import { DEV_SIMULATE_ERROR } from './devConfig';
import usersData from '../../mocks/mock-users.json';

/**
 * Check if query matches text using word-based matching
 */
function matchesQuery(queryLower: string, text: string | undefined | null): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  
  // Exact match or substring match
  if (textLower.includes(queryLower)) return true;
  
  // Word-based matching: split by underscores for usernames too
  const queryWords = queryLower.split(/[\s_]+/).filter(w => w.length > 0);
  const textWords = textLower.split(/[\s_]+/).filter(w => w.length > 0);
  
  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Search users from canonical mock data (mock-users.json only) with enhanced matching
 */
async function fetchUsersFromMockData(queryLower: string): Promise<UserSearchResult[]> {
  // Search ONLY in canonical mock-users.json (u_1 through u_8)
  const usersFromMock = Object.values(usersData as Record<string, any>)
    .filter((user: any) => {
      const usernameMatch = matchesQuery(queryLower, user.username);
      const displayNameMatch = matchesQuery(queryLower, user.displayName);
      const bioMatch = matchesQuery(queryLower, user.bio);
      
      // Also match on first/last name separately for display names
      const displayNameWords = (user.displayName || '').toLowerCase().split(/\s+/);
      const nameMatch = displayNameWords.some(name => name.includes(queryLower) || queryLower.includes(name));
      
      return usernameMatch || displayNameMatch || bioMatch || nameMatch;
    })
    .map((user: any): UserSearchResult => ({
      id: user.id,
      uid: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isFollowing: false, // Would need to check from session in real implementation
      followerCount: user.followers?.total || 0,
      verified: user.isVerified || false,
    }));

  return usersFromMock;
}

/**
 * Get text fields for relevance scoring
 */
function getUserTextFields(user: UserSearchResult): string[] {
  return [
    user.username,
    user.displayName,
    user.bio,
  ];
}

/**
 * Search users only
 */
export async function searchUsers(
  q: string,
  filters: UserSearchFilters = {},
  sortBy: UserSortBy = 'relevance',
  cursor: string | null = null
): Promise<CategorySearchResponse<UserSearchResult>> {
  const startTime = Date.now();

  // Simulate error conditions (DEV-ONLY)
  await simulateError(DEV_SIMULATE_ERROR);

  // Validate query
  const queryLower = validateQuery(q, 2);
  if (!queryLower) {
    return createEmptyResponse<UserSearchResult>(q, Date.now() - startTime);
  }

  // Simulate network delay
  await simulateNetworkDelay(400, 200);

  // Fetch and filter users from mock data
  let users = await fetchUsersFromMockData(queryLower);

  // Apply relevance scoring (use original query q for scoring, but filtering uses queryLower)
  users = applyRelevanceSorting(users, queryLower, getUserTextFields, calculateRelevanceScore);

  // Apply filters
  users = filterUsers(users, filters);

  // Apply sorting (if not relevance, which is already applied)
  if (sortBy !== 'relevance') {
    users = sortUsers(users, sortBy);
  }

  // Calculate pagination
  const { paginatedItems, totalEstimate, hasMore, nextCursor } = calculatePagination(users, cursor);

  return {
    items: paginatedItems,
    totalEstimate,
    nextCursor,
    hasMore,
    searchTime: Date.now() - startTime,
    query: q,
  };
}

