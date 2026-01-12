/**
 * Hashtag search implementation
 * Handles searching for hashtags with filtering, sorting, and pagination
 */

import type { HashtagSearchResult } from '../../types/search';
import type {
  CategorySearchResponse,
  HashtagSearchFilters,
  HashtagSortBy,
} from './types';
import { filterHashtags, sortHashtags } from './filters';
import { calculateRelevanceScore } from './relevance';
import { calculatePagination } from './pagination';
import { validateQuery, simulateError, simulateNetworkDelay, createEmptyResponse, applyRelevanceSorting } from './searchUtils';
import { DEV_SIMULATE_ERROR } from './devConfig';
import fitpicsData from '../../mocks/mock-fitpics.json';

/**
 * Generate hashtags from canonical FitPic data (extracted from captions)
 */
function fetchHashtagsFromMockData(queryLower: string): HashtagSearchResult[] {
  // Extract hashtags from FitPic captions
  const hashtagMap = new Map<string, number>();
  
  fitpicsData.fitpics.forEach(fitpic => {
    if (fitpic.caption) {
      const hashtags = fitpic.caption.match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const tagLower = tag.substring(1).toLowerCase();
        hashtagMap.set(tagLower, (hashtagMap.get(tagLower) || 0) + 1);
      });
    }
  });
  
  // Convert to hashtag search results and filter by query
  return Array.from(hashtagMap.entries())
    .filter(([tag]) => tag.includes(queryLower))
    .map(([tag, count]) => ({
      id: `hashtag-${tag}`,
      tag,
      postCount: count,
      isTrending: count >= 2, // Trending if used in 2+ fitpics
      trendDirection: count >= 3 ? 'up' as const : (count >= 2 ? 'stable' as const : undefined),
    }))
    .sort((a, b) => b.postCount - a.postCount); // Sort by usage count
}

/**
 * Get text fields for relevance scoring
 */
function getHashtagTextFields(hashtag: HashtagSearchResult): string[] {
  return [hashtag.tag];
}

/**
 * Search hashtags only
 */
export async function searchHashtags(
  q: string,
  filters: HashtagSearchFilters = {},
  sortBy: HashtagSortBy = 'relevance',
  cursor: string | null = null
): Promise<CategorySearchResponse<HashtagSearchResult>> {
  const startTime = Date.now();

  // Simulate error conditions (DEV-ONLY)
  await simulateError(DEV_SIMULATE_ERROR);

  // Validate query (hashtags can be shorter)
  const queryLower = validateQuery(q, 1);
  if (!queryLower) {
    return createEmptyResponse<HashtagSearchResult>(q, Date.now() - startTime);
  }

  // Simulate network delay
  await simulateNetworkDelay(350, 150);

  // Fetch hashtags from mock data
  let hashtags = fetchHashtagsFromMockData(queryLower);

  // Apply relevance scoring
  hashtags = applyRelevanceSorting(hashtags, q, getHashtagTextFields, calculateRelevanceScore);

  // Apply filters
  hashtags = filterHashtags(hashtags, filters);

  // Apply sorting (if not relevance, which is already applied)
  if (sortBy !== 'relevance') {
    hashtags = sortHashtags(hashtags, sortBy);
  }

  // Calculate pagination
  const { paginatedItems, totalEstimate, hasMore, nextCursor } = calculatePagination(hashtags, cursor);

  return {
    items: paginatedItems,
    totalEstimate,
    nextCursor,
    hasMore,
    searchTime: Date.now() - startTime,
    query: q,
  };
}

