/**
 * FitPic search implementation
 * Handles searching for fitpics with filtering, sorting, and pagination
 */

import type { FitPicSearchResult } from '../../types/search';
import type {
  CategorySearchResponse,
  FitPicSearchFilters,
  FitPicSortBy,
} from './types';
import { filterFitPics, sortFitPics } from './filters';
import { calculateRelevanceScore } from './relevance';
import { calculatePagination } from './pagination';
import { validateQuery, simulateError, simulateNetworkDelay, createEmptyResponse, applyRelevanceSorting } from './searchUtils';
import { transformFitPicToSearchResult } from './mappers';
import { DEV_SIMULATE_ERROR } from './devConfig';
import fitpicsData from '../../mocks/mock-fitpics.json';
import productsData from '../../mocks/mock-products.json';

/**
 * Check if query matches text using word-based matching
 */
function matchesQuery(queryLower: string, text: string | undefined | null): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  
  // Exact match or substring match
  if (textLower.includes(queryLower)) return true;
  
  // Word-based matching
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  const textWords = textLower.split(/\s+/).filter(w => w.length > 0);
  
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
 * Search fitpics from mock data with enhanced matching (includes product info)
 */
function fetchFitPicsFromMockData(queryLower: string): FitPicSearchResult[] {
  const canonicalFitpics = fitpicsData.fitpics.filter(fitpic => {
    // Match on caption
    const captionMatch = matchesQuery(queryLower, fitpic.caption);
    
    // Match on author
    const authorMatch = matchesQuery(queryLower, fitpic.author);
    
    // Match on hashtags in caption
    const hashtags = fitpic.caption 
      ? (fitpic.caption.match(/#\w+/g) || []).map((tag: string) => tag.substring(1).toLowerCase())
      : [];
    const hashtagMatch = hashtags.some(tag => tag.includes(queryLower) || queryLower.includes(tag));
    
    // Match on featured products (name, brand, description)
    // This is important for making searches return multiple fitpics
    const productMatch = (fitpic.featuredProducts?.productIds || []).some((productId: string) => {
      const product = productsData.products.find((p: any) => p.id === productId);
      if (!product) return false;
      return matchesQuery(queryLower, product.name) ||
             matchesQuery(queryLower, product.brand) ||
             matchesQuery(queryLower, product.description);
    });
    
    // Match on keywords in caption (word-based)
    const captionWords = (fitpic.caption || '').toLowerCase().split(/\s+/);
    const keywordMatch = captionWords.some(word => word.includes(queryLower) || queryLower.includes(word));
    
    return captionMatch || authorMatch || hashtagMatch || productMatch || keywordMatch;
  });

  return canonicalFitpics.map(transformFitPicToSearchResult);
}

/**
 * Get text fields for relevance scoring
 */
function getFitPicTextFields(fitpic: FitPicSearchResult): string[] {
  return [
    fitpic.caption,
    fitpic.author.username,
    fitpic.hashtags?.join(' ') || '',
  ];
}

/**
 * Search fitpics only
 */
export async function searchFitPics(
  q: string,
  filters: FitPicSearchFilters = {},
  sortBy: FitPicSortBy = 'relevance',
  cursor: string | null = null
): Promise<CategorySearchResponse<FitPicSearchResult>> {
  const startTime = Date.now();

  // Simulate error conditions (DEV-ONLY)
  await simulateError(DEV_SIMULATE_ERROR);

  // Validate query
  const queryLower = validateQuery(q, 2);
  if (!queryLower) {
    return createEmptyResponse<FitPicSearchResult>(q, Date.now() - startTime);
  }

  // Simulate network delay
  await simulateNetworkDelay(450, 200);

  // Fetch and transform fitpics from mock data
  let fitpics = fetchFitPicsFromMockData(queryLower);

  // Apply relevance scoring (use queryLower for consistent matching)
  fitpics = applyRelevanceSorting(fitpics, queryLower, getFitPicTextFields, calculateRelevanceScore);

  // Apply filters
  fitpics = filterFitPics(fitpics, filters);

  // Apply sorting (if not relevance, which is already applied)
  if (sortBy !== 'relevance') {
    fitpics = sortFitPics(fitpics, sortBy);
  }

  // Calculate pagination
  const { paginatedItems, totalEstimate, hasMore, nextCursor } = calculatePagination(fitpics, cursor);

  return {
    items: paginatedItems,
    totalEstimate,
    nextCursor,
    hasMore,
    searchTime: Date.now() - startTime,
    query: q,
  };
}

