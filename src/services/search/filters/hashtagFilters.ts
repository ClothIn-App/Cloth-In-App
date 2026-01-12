/**
 * Hashtag filtering and sorting logic
 */

import type { HashtagSearchResult } from '../../../types/search';
import type { HashtagSearchFilters, HashtagSortBy } from '../types';

/**
 * Filter hashtags based on search filters
 */
export function filterHashtags(
  hashtags: HashtagSearchResult[],
  filters: HashtagSearchFilters = {}
): HashtagSearchResult[] {
  let filtered = [...hashtags];

  if (filters.trendingOnly) {
    filtered = filtered.filter(hashtag => hashtag.isTrending === true);
  }

  if (filters.minPostCount !== undefined) {
    filtered = filtered.filter(hashtag => hashtag.postCount >= filters.minPostCount!);
  }

  if (filters.maxPostCount !== undefined) {
    filtered = filtered.filter(hashtag => hashtag.postCount <= filters.maxPostCount!);
  }

  return filtered;
}

/**
 * Sort hashtags based on sort option
 */
export function sortHashtags(hashtags: HashtagSearchResult[], sortBy: HashtagSortBy = 'relevance'): HashtagSearchResult[] {
  const sorted = [...hashtags];

  switch (sortBy) {
    case 'relevance':
      return sorted;

    case 'post_count':
      return sorted.sort((a, b) => b.postCount - a.postCount);

    case 'trending':
      // Trending first, then by post count
      return sorted.sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        return b.postCount - a.postCount;
      });

    default:
      return sorted;
  }
}

