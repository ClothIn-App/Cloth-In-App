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
import searchSuggestionsData from '../../mocks/searchSuggestions.json';
import fitpicsData from '../../mocks/mock-fitpics.json';
import productsData from '../../mocks/mock-products.json';
import usersData from '../../mocks/mock-users.json';
import { DEV_SIMULATE_ERROR } from './devConfig';
import { transformFitPicToSearchResult, transformProductToSearchResult } from './mappers';
import { getRecents } from './recentsStorage';
import type { UserSearchResult } from '../../types/search';

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
  
  // Helper function for word-based matching
  const matchesQuery = (queryLower: string, text: string | undefined | null): boolean => {
    if (!text) return false;
    const textLower = text.toLowerCase();
    if (textLower.includes(queryLower)) return true;
    const queryWords = queryLower.split(/[\s_]+/).filter(w => w.length > 0);
    const textWords = textLower.split(/[\s_]+/).filter(w => w.length > 0);
    for (const queryWord of queryWords) {
      for (const textWord of textWords) {
        if (textWord.includes(queryWord) || queryWord.includes(textWord)) return true;
      }
    }
    return false;
  };
  
  // Use ONLY canonical mock data for consistency with Home feed
  // Filter users from canonical mock-users.json with enhanced matching
  const users: UserSearchResult[] = Object.values(usersData as Record<string, any>)
    .filter((user: any) => {
      const usernameMatch = matchesQuery(queryLower, user.username);
      const displayNameMatch = matchesQuery(queryLower, user.displayName);
      const bioMatch = matchesQuery(queryLower, user.bio);
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
      isFollowing: false,
      followerCount: user.followers?.total || 0,
      verified: user.isVerified || false,
    }));
  
  // Filter FitPics from canonical mock data with enhanced matching (includes products)
  const canonicalFitpics = fitpicsData.fitpics.filter(fitpic => {
    const captionMatch = matchesQuery(queryLower, fitpic.caption);
    const authorMatch = matchesQuery(queryLower, fitpic.author);
    const hashtags = fitpic.caption 
      ? (fitpic.caption.match(/#\w+/g) || []).map((tag: string) => tag.substring(1).toLowerCase())
      : [];
    const hashtagMatch = hashtags.some(tag => tag.includes(queryLower) || queryLower.includes(tag));
    // Match on featured products
    const productMatch = (fitpic.featuredProducts?.productIds || []).some((productId: string) => {
      const product = productsData.products.find((p: any) => p.id === productId);
      if (!product) return false;
      return matchesQuery(queryLower, product.name) ||
             matchesQuery(queryLower, product.brand) ||
             matchesQuery(queryLower, product.description);
    });
    const captionWords = (fitpic.caption || '').toLowerCase().split(/\s+/);
    const keywordMatch = captionWords.some(word => word.includes(queryLower) || queryLower.includes(word));
    return captionMatch || authorMatch || hashtagMatch || productMatch || keywordMatch;
  });
  
  // Transform canonical FitPics to search result format
  const fitpics = canonicalFitpics.map(transformFitPicToSearchResult);
  
  // Filter Products from canonical mock data with enhanced matching
  const canonicalProducts = productsData.products.filter((product: any) => {
    const nameMatch = matchesQuery(queryLower, product.name);
    const brandMatch = matchesQuery(queryLower, product.brand);
    const descMatch = matchesQuery(queryLower, product.description);
    const categoryMatch = matchesQuery(queryLower, product.category);
    const nameWords = (product.name || '').toLowerCase().split(/\s+/);
    const brandWords = (product.brand || '').toLowerCase().split(/\s+/);
    const keywordMatch = nameWords.some(word => word.includes(queryLower) || queryLower.includes(word)) ||
                        brandWords.some(word => word.includes(queryLower) || queryLower.includes(word));
    return nameMatch || brandMatch || descMatch || categoryMatch || keywordMatch;
  });
  
  // Transform canonical Products to search result format
  const products = canonicalProducts.map(transformProductToSearchResult);
  
  // Generate hashtags from FitPic captions (extract from canonical data)
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
  const hashtags: HashtagSearchResult[] = Array.from(hashtagMap.entries())
    .filter(([tag]) => tag.includes(queryLower))
    .map(([tag, count]) => ({
      id: `hashtag-${tag}`,
      tag,
      postCount: count,
      isTrending: count >= 2, // Consider trending if used in 2+ fitpics
      trendDirection: count >= 3 ? 'up' as const : (count >= 2 ? 'stable' as const : undefined),
    }))
    .sort((a, b) => b.postCount - a.postCount); // Sort by usage count
  
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

