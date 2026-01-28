/**
 * Search API types
 * Shared types for search service
 */

import type { SearchResult, SearchCategory, SearchFilters } from '../../types/search';

// Response type for searchTop with pagination
export type SearchTopResponse = {
  results: SearchResult;
  totalEstimate: number;
  nextCursor: string | null;
  searchTime?: number; // Time taken in milliseconds
  query?: string; // Original query
  // Individual category counts (for tab badges)
  categoryCounts?: {
    users: number;
    fitpics: number;
    products: number;
    hashtags: number;
  };
};

// Paginated response for category-specific searches
export type CategorySearchResponse<T> = {
  items: T[];
  totalEstimate: number;
  nextCursor: string | null;
  hasMore: boolean;
  searchTime?: number;
  query?: string;
};

// Filter options for different categories
export type UserSearchFilters = {
  verifiedOnly?: boolean;
  minFollowers?: number;
  maxFollowers?: number;
  isFollowing?: boolean; // Only show users current user follows
  excludeFollowing?: boolean; // Exclude users current user follows
};

export type FitPicSearchFilters = {
  dateRange?: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  minLikes?: number;
  minSaves?: number;
  hashtags?: string[]; // Must include these hashtags
  excludeHashtags?: string[]; // Must not include these hashtags
  authorId?: string; // Filter by specific author
};

export type ProductSearchFilters = {
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  categories?: string[];
  availableOnly?: boolean;
  minRating?: number;
  onSaleOnly?: boolean;
  colors?: string[];
  sizes?: string[];
};

export type HashtagSearchFilters = {
  trendingOnly?: boolean;
  minPostCount?: number;
  maxPostCount?: number;
};

// Combined search filters with category-specific options
export type ExtendedSearchFilters = SearchFilters & {
  users?: UserSearchFilters;
  fitpics?: FitPicSearchFilters;
  products?: ProductSearchFilters;
  hashtags?: HashtagSearchFilters;
};

// Sort options for different categories
export type UserSortBy = 'relevance' | 'newest' | 'follower_count' | 'username';
export type FitPicSortBy = 'relevance' | 'newest' | 'most_liked' | 'most_saved' | 'most_commented';
export type ProductSortBy = 'relevance' | 'newest' | 'price_low' | 'price_high' | 'rating' | 'most_reviewed';
export type HashtagSortBy = 'relevance' | 'post_count' | 'trending';

// Search metadata for analytics
export type SearchMetadata = {
  query: string;
  totalResults: number;
  searchTime: number;
  category: SearchCategory;
  filtersApplied: number;
  suggestions?: string[];
  relatedQueries?: string[];
};

// Hashtag detail response
export type HashtagDetailResponse = {
  tag: string;
  postCount: number;
  isTrending: boolean;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercent?: number;
  relatedHashtags: string[];
  createdAt?: string; // When hashtag was first used
  topPosts?: string[]; // Top post IDs
};
