/**
 * Search utility functions
 * Common utilities shared across search functions
 */

import { DEV_SIMULATE_ERROR } from './devConfig';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate search query
 */
export function validateQuery(q: string, minLength: number = 2): string | null {
  const queryLower = q.toLowerCase().trim();
  if (!queryLower || queryLower.length < minLength) {
    return null;
  }
  return queryLower;
}

/**
 * Simulate error conditions (DEV-ONLY)
 */
export async function simulateError(errorType: typeof DEV_SIMULATE_ERROR): Promise<void> {
  if (errorType === 'error') {
    await delay(500);
    throw new Error('Failed to search');
  }
  if (errorType === 'no-connection') {
    await delay(500);
    throw new Error('No internet connection');
  }
}

/**
 * Simulate network delay with random variation
 */
export async function simulateNetworkDelay(baseDelay: number = 400, variation: number = 200): Promise<void> {
  await delay(baseDelay + Math.random() * variation);
}

/**
 * Create empty search response
 */
export function createEmptyResponse<T>(query: string, searchTime: number = 0) {
  return {
    items: [] as T[],
    totalEstimate: 0,
    nextCursor: null,
    hasMore: false,
    searchTime,
    query,
  };
}

/**
 * Apply relevance scoring and sorting
 */
export function applyRelevanceSorting<T>(
  items: T[],
  query: string,
  getTextFields: (item: T) => string[],
  calculateScore: (query: string, text: string) => number
): T[] {
  const itemsWithScores = items.map(item => ({
    item,
    score: calculateScore(
      query,
      getTextFields(item).filter(Boolean).join(' ')
    ),
  }));

  return itemsWithScores
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

