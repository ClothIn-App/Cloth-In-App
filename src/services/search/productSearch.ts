/**
 * Product search implementation
 * Handles searching for products with filtering, sorting, and pagination
 */

import type { ProductSearchResult } from '../../types/search';
import type {
  CategorySearchResponse,
  ProductSearchFilters,
  ProductSortBy,
} from './types';
import { filterProducts, sortProducts } from './filters';
import { calculateRelevanceScore } from './relevance';
import { calculatePagination } from './pagination';
import { validateQuery, simulateError, simulateNetworkDelay, createEmptyResponse, applyRelevanceSorting } from './searchUtils';
import { transformProductToSearchResult } from './mappers';
import { DEV_SIMULATE_ERROR } from './devConfig';
import productsData from '../../mocks/mock-products.json';

/**
 * Check if query matches text using word-based matching
 * More flexible than simple substring matching
 */
function matchesQuery(queryLower: string, text: string | undefined | null): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  
  // Exact match or substring match
  if (textLower.includes(queryLower)) return true;
  
  // Word-based matching: check if any word in the query matches any word in the text
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  const textWords = textLower.split(/\s+/).filter(w => w.length > 0);
  
  // Check if any query word is contained in any text word (or vice versa)
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
 * Search products from mock data with enhanced matching
 */
function fetchProductsFromMockData(queryLower: string): ProductSearchResult[] {
  const canonicalProducts = productsData.products.filter((product: any) => {
    // Match on name, brand, description
    const nameMatch = matchesQuery(queryLower, product.name);
    const brandMatch = matchesQuery(queryLower, product.brand);
    const descMatch = matchesQuery(queryLower, product.description);
    const categoryMatch = matchesQuery(queryLower, product.category);
    
    // Also extract keywords from product name/brand for better matching
    // e.g., "Classic White Sneakers" should match "sneakers", "white", "classic"
    const nameWords = (product.name || '').toLowerCase().split(/\s+/);
    const brandWords = (product.brand || '').toLowerCase().split(/\s+/);
    const keywordMatch = nameWords.some(word => word.includes(queryLower) || queryLower.includes(word)) ||
                        brandWords.some(word => word.includes(queryLower) || queryLower.includes(word));
    
    return nameMatch || brandMatch || descMatch || categoryMatch || keywordMatch;
  });

  return canonicalProducts.map(transformProductToSearchResult);
}

/**
 * Get text fields for relevance scoring
 */
function getProductTextFields(product: ProductSearchResult): string[] {
  return [
    product.name,
    product.brand,
    product.category,
    product.description,
  ];
}

/**
 * Search products only
 */
export async function searchProducts(
  q: string,
  filters: ProductSearchFilters = {},
  sortBy: ProductSortBy = 'relevance',
  cursor: string | null = null
): Promise<CategorySearchResponse<ProductSearchResult>> {
  const startTime = Date.now();

  // Simulate error conditions (DEV-ONLY)
  await simulateError(DEV_SIMULATE_ERROR);

  // Validate query
  const queryLower = validateQuery(q, 2);
  if (!queryLower) {
    return createEmptyResponse<ProductSearchResult>(q, Date.now() - startTime);
  }

  // Simulate network delay
  await simulateNetworkDelay(450, 200);

  // Fetch and transform products from mock data
  let products = fetchProductsFromMockData(queryLower);

  // Apply relevance scoring (use queryLower for consistent matching)
  products = applyRelevanceSorting(products, queryLower, getProductTextFields, calculateRelevanceScore);

  // Apply filters
  products = filterProducts(products, filters);

  // Apply sorting (if not relevance, which is already applied)
  if (sortBy !== 'relevance') {
    products = sortProducts(products, sortBy);
  }

  // Calculate pagination
  const { paginatedItems, totalEstimate, hasMore, nextCursor } = calculatePagination(products, cursor);

  return {
    items: paginatedItems,
    totalEstimate,
    nextCursor,
    hasMore,
    searchTime: Date.now() - startTime,
    query: q,
  };
}

