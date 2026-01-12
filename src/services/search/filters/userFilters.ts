/**
 * User filtering and sorting logic
 */

import type { UserSearchResult } from '../../../types/search';
import type { UserSearchFilters, UserSortBy } from '../types';

/**
 * Filter users based on search filters
 */
export function filterUsers(
  users: UserSearchResult[],
  filters: UserSearchFilters = {}
): UserSearchResult[] {
  let filtered = [...users];

  if (filters.verifiedOnly) {
    filtered = filtered.filter(user => user.verified === true);
  }

  if (filters.minFollowers !== undefined) {
    filtered = filtered.filter(user => (user.followerCount || 0) >= filters.minFollowers!);
  }

  if (filters.maxFollowers !== undefined) {
    filtered = filtered.filter(user => (user.followerCount || 0) <= filters.maxFollowers!);
  }

  // Note: isFollowing and excludeFollowing should be handled by backend
  // This is just for mock filtering
  if (filters.isFollowing !== undefined) {
    filtered = filtered.filter(user => user.isFollowing === filters.isFollowing);
  }

  return filtered;
}

/**
 * Sort users based on sort option
 */
export function sortUsers(users: UserSearchResult[], sortBy: UserSortBy = 'relevance'): UserSearchResult[] {
  const sorted = [...users];

  switch (sortBy) {
    case 'relevance':
      // Keep original order (already sorted by relevance from search)
      return sorted;

    case 'newest':
      // Note: Would need createdAt field in UserSearchResult
      // For now, maintain order
      return sorted;

    case 'follower_count':
      return sorted.sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0));

    case 'username':
      return sorted.sort((a, b) => a.username.localeCompare(b.username));

    default:
      return sorted;
  }
}

