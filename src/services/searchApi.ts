/**
 * Search Data Layer
 * Mock-first search service that will be API-ready later
 * Single interface for all search-related operations
 * 
 * This is the public API facade that re-exports functions from internal modules
 */

// Re-export types
export type { RecentSearchItem } from './search/recentsStorage';
export type { SearchTopResponse } from './search/types';

// Re-export dev config
export { DEV_SIMULATE_ERROR } from './search/devConfig';

// Re-export recents storage functions
export { getRecents, addRecent, clearRecents } from './search/recentsStorage';

// Re-export search functions
export { getTrending, getSuggestions, searchTop } from './search/mockSearch';
