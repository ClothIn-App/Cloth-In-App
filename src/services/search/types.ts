/**
 * Search API types
 * Shared types for search service
 */

import type { SearchResult } from '../../types/search';

// Response type for searchTop with pagination
export type SearchTopResponse = {
  results: SearchResult;
  totalEstimate: number;
  nextCursor: string | null;
};

