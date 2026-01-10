/**
 * Pagination utilities
 * Handles cursor-based pagination logic
 */

export const RESULTS_PER_PAGE = 20;

/**
 * Calculate pagination offset from cursor
 * Cursor format: "page_N" where N is the page number (0-indexed internally)
 */
export function getOffsetFromCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  
  // Cursor format: "page_2" where 2 is the page number
  const match = cursor.match(/page_(\d+)/);
  if (match) {
    const pageNumber = parseInt(match[1], 10);
    return pageNumber * RESULTS_PER_PAGE;
  }
  
  return 0;
}

/**
 * Generate next cursor from current page
 * Returns null if no more pages
 */
export function generateNextCursor(page: number, hasMore: boolean): string | null {
  if (!hasMore) return null;
  return `page_${page + 1}`;
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination<T>(
  items: T[],
  cursor: string | null
): {
  paginatedItems: T[];
  totalEstimate: number;
  offset: number;
  page: number;
  hasMore: boolean;
  nextCursor: string | null;
} {
  const totalEstimate = items.length;
  const offset = getOffsetFromCursor(cursor);
  const page = Math.floor(offset / RESULTS_PER_PAGE);
  const paginatedItems = items.slice(offset, offset + RESULTS_PER_PAGE);
  const hasMore = offset + RESULTS_PER_PAGE < totalEstimate;
  const nextCursor = generateNextCursor(page, hasMore);

  return {
    paginatedItems,
    totalEstimate,
    offset,
    page,
    hasMore,
    nextCursor,
  };
}

