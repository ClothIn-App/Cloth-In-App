/**
 * Mock search implementation
 * Handles filtering, delays, and search result generation
 */

import type {
  SearchSuggestion,
  SearchResult,
  HashtagSearchResult,
} from '../../types/search';
import type { SearchTopResponse } from './types';
import trendingSearchesData from '../../mocks/trendingSearches.json';
import searchResultsData from '../../mocks/searchResults.json';
import searchSuggestionsData from '../../mocks/searchSuggestions.json';
import fitpicsData from '../../mocks/mock-fitpics.json';
import productsData from '../../mocks/mock-products.json';
import { DEV_SIMULATE_ERROR } from './devConfig';
import { transformFitPicToSearchResult, transformProductToSearchResult } from './mappers';
import { getRecents } from './recentsStorage';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get trending searches
 */
export async function getTrending(): Promise<SearchSuggestion[]> {
  await delay(200);
  
  return trendingSearchesData.map((text, index) => ({
    id: `trending-${index}`,
    text,
    type: 'trending' as const,
    count: Math.floor(Math.random() * 10000) + 1000, // Mock trending count
  }));
}

/**
 * Get search suggestions based on query
 * Returns mixed suggestions with dedup priority: Recent > Suggestions > Trending
 */
export async function getSuggestions(q: string): Promise<SearchSuggestion[]> {
  // DEV-ONLY: Simulate errors
  if (DEV_SIMULATE_ERROR === 'error') {
    await delay(300);
    throw new Error('Failed to load suggestions');
  }
  if (DEV_SIMULATE_ERROR === 'no-connection') {
    await delay(300);
    throw new Error('No internet connection');
  }

  if (!q.trim()) {
    // Return recent searches if query is empty
    const recents = await getRecents();
    return recents
      .filter(item => item.type === 'query')
      .slice(0, 5)
      .map(item => ({
        id: `recent-${item.text}`,
        text: item.text,
        type: 'recent' as const,
      }));
  }
  
  await delay(300);
  
  const queryLower = q.toLowerCase();
  const allSuggestions: SearchSuggestion[] = [];
  
  // 1. Priority: Recent searches matching query
  const recents = await getRecents();
  const recentMatches = recents
    .filter(item => {
      if (item.type === 'query') {
        return item.text.toLowerCase().includes(queryLower);
      }
      if (item.type === 'user') {
        return item.username.toLowerCase().includes(queryLower) ||
               item.displayName?.toLowerCase().includes(queryLower);
      }
      if (item.type === 'product') {
        return item.name.toLowerCase().includes(queryLower) ||
               item.brand?.toLowerCase().includes(queryLower);
      }
      return false;
    })
    .slice(0, 3)
    .map(item => {
      if (item.type === 'query') {
        return {
          id: `recent-${item.text}`,
          text: item.text,
          type: 'recent' as const,
        };
      }
      if (item.type === 'user') {
        return {
          id: `recent-user-${item.uid}`,
          text: item.displayName || item.username,
          type: 'recent' as const,
          category: 'users' as const,
        };
      }
      if (item.type === 'product') {
        return {
          id: `recent-product-${item.id}`,
          text: item.name,
          type: 'recent' as const,
          category: 'products' as const,
        };
      }
      return null;
    })
    .filter((item): item is SearchSuggestion => item !== null);
  
  allSuggestions.push(...recentMatches);
  
  // 2. Suggestions from mock data
  const suggestionMatches = searchSuggestionsData
    .filter(item => item.text.toLowerCase().includes(queryLower))
    .slice(0, 5)
    .map(item => ({
      ...item,
      type: 'suggestion' as const,
    }));
  
  allSuggestions.push(...suggestionMatches);
  
  // 3. Trending searches matching query
  const trendingMatches = trendingSearchesData
    .filter(text => text.toLowerCase().includes(queryLower))
    .slice(0, 3)
    .map((text, index) => ({
      id: `trending-${index}`,
      text,
      type: 'trending' as const,
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
  
  return deduped.slice(0, 10);
}

/**
 * Search top results (default "Top Results" page)
 * Returns: Profiles → FitPics (thumbnails only) → Products
 */
export async function searchTop(q: string): Promise<SearchTopResponse> {
  // DEV-ONLY: Simulate errors
  if (DEV_SIMULATE_ERROR === 'error') {
    await delay(500);
    throw new Error('Failed to load search results');
  }
  if (DEV_SIMULATE_ERROR === 'no-connection') {
    await delay(500);
    throw new Error('No internet connection');
  }

  await delay(500);
  
  const queryLower = q.toLowerCase().trim();
  
  // Handle empty or unknown queries
  if (!queryLower || queryLower.length < 2) {
    return {
      results: {
        users: [],
        fitpics: [],
        products: [],
        hashtags: [],
      },
      totalEstimate: 0,
      nextCursor: null,
    };
  }
  
  // Use canonical mock data for FitPics and Products to ensure consistency with Home feed
  // Users and Hashtags still use searchResults.json (they don't have detail screens)
  const allResults = searchResultsData;
  
  // Filter users from searchResults.json (unchanged)
  const users = allResults.users.filter(user => 
    user.username.toLowerCase().includes(queryLower) ||
    user.displayName?.toLowerCase().includes(queryLower) ||
    user.bio?.toLowerCase().includes(queryLower)
  );
  
  // Filter FitPics from canonical mock data
  const canonicalFitpics = fitpicsData.fitpics.filter(fitpic => {
    const captionMatch = fitpic.caption?.toLowerCase().includes(queryLower) || false;
    const authorMatch = fitpic.author?.toLowerCase().includes(queryLower) || false;
    // Extract hashtags from caption for matching
    const hashtags = fitpic.caption 
      ? (fitpic.caption.match(/#\w+/g) || []).map((tag: string) => tag.substring(1).toLowerCase())
      : [];
    const hashtagMatch = hashtags.some(tag => tag.includes(queryLower));
    return captionMatch || authorMatch || hashtagMatch;
  });
  
  // Transform canonical FitPics to search result format
  const fitpics = canonicalFitpics.map(transformFitPicToSearchResult);
  
  // Filter Products from canonical mock data
  const canonicalProducts = productsData.products.filter((product: any) => 
    product.name?.toLowerCase().includes(queryLower) ||
    product.brand?.toLowerCase().includes(queryLower) ||
    product.description?.toLowerCase().includes(queryLower)
  );
  
  // Transform canonical Products to search result format
  const products = canonicalProducts.map(transformProductToSearchResult);
  
  // Filter hashtags from searchResults.json (unchanged)
  const hashtags: HashtagSearchResult[] = allResults.hashtags
    .filter(hashtag => hashtag.tag.toLowerCase().includes(queryLower))
    .map(hashtag => ({
      ...hashtag,
      trendDirection: (hashtag.trendDirection === 'up' || hashtag.trendDirection === 'down' || hashtag.trendDirection === 'stable')
        ? hashtag.trendDirection
        : undefined,
    }));
  
  // Limit results for preview (Top Results page)
  const limitedUsers = users.slice(0, 5);
  const limitedFitpics = fitpics.slice(0, 6); // Thumbnail grid (2x3)
  const limitedProducts = products.slice(0, 6);
  const limitedHashtags = hashtags.slice(0, 5);
  
  // Calculate total estimate
  const totalEstimate = users.length + fitpics.length + products.length + hashtags.length;
  
  // Determine if there are more results (simple pagination logic)
  const hasMore = 
    users.length > limitedUsers.length ||
    fitpics.length > limitedFitpics.length ||
    products.length > limitedProducts.length ||
    hashtags.length > limitedHashtags.length;
  
  const nextCursor = hasMore ? `cursor_${queryLower}_${Date.now()}` : null;
  
  // Handle unknown queries (no matches)
  if (totalEstimate === 0) {
    return {
      results: {
        users: [],
        fitpics: [],
        products: [],
        hashtags: [],
      },
      totalEstimate: 0,
      nextCursor: null,
    };
  }
  
  return {
    results: {
      users: limitedUsers,
      fitpics: limitedFitpics,
      products: limitedProducts,
      hashtags: limitedHashtags,
    },
    totalEstimate,
    nextCursor,
  };
}

