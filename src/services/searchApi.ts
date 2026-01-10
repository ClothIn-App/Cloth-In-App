/**
 * Search Data Layer
 * Mock-first search service that will be API-ready later
 * Single interface for all search-related operations
 * 
 * This is the public API facade that re-exports functions from internal modules
 */

// Re-export types
export type { RecentSearchItem } from './search/recentsStorage';
export type { 
  SearchTopResponse,
  CategorySearchResponse,
  UserSearchFilters,
  FitPicSearchFilters,
  ProductSearchFilters,
  HashtagSearchFilters,
  UserSortBy,
  FitPicSortBy,
  ProductSortBy,
  HashtagSortBy,
  SearchMetadata,
  HashtagDetailResponse,
} from './search/types';

// Re-export dev config
export { DEV_SIMULATE_ERROR } from './search/devConfig';

// Re-export recents storage functions
export { getRecents, addRecent, clearRecents } from './search/recentsStorage';

// Re-export basic search functions
export { getTrending, getSuggestions, searchTop } from './search/mockSearch';

// Re-export category-specific search functions
export {
  searchUsers,
  searchFitPics,
  searchProducts,
  searchHashtags,
} from './search/categorySearch';
