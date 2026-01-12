/**
 * Product filtering and sorting logic
 */

import type { ProductSearchResult } from '../../../types/search';
import type { ProductSearchFilters, ProductSortBy } from '../types';

/**
 * Filter products based on search filters
 */
export function filterProducts(
  products: ProductSearchResult[],
  filters: ProductSearchFilters = {}
): ProductSearchResult[] {
  let filtered = [...products];

  if (filters.priceRange) {
    filtered = filtered.filter(product => {
      const price = product.price;
      if (price === null || price === undefined) return false;
      return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
    });
  }

  if (filters.brands && filters.brands.length > 0) {
    const brandLower = filters.brands.map(b => b.toLowerCase());
    filtered = filtered.filter(product => 
      product.brand && brandLower.includes(product.brand.toLowerCase())
    );
  }

  if (filters.categories && filters.categories.length > 0) {
    const categoryLower = filters.categories.map(c => c.toLowerCase());
    filtered = filtered.filter(product => 
      product.category && categoryLower.includes(product.category.toLowerCase())
    );
  }

  if (filters.availableOnly) {
    filtered = filtered.filter(product => product.isAvailable !== false);
  }

  if (filters.minRating !== undefined) {
    filtered = filtered.filter(product => 
      product.rating !== null && product.rating !== undefined && product.rating >= filters.minRating!
    );
  }

  if (filters.onSaleOnly) {
    filtered = filtered.filter(product => 
      product.originalPrice && product.price && product.originalPrice > product.price
    );
  }

  if (filters.colors && filters.colors.length > 0) {
    filtered = filtered.filter(product => 
      product.colors && product.colors.some(color => 
        filters.colors!.some(fc => fc.toLowerCase() === color.toLowerCase())
      )
    );
  }

  if (filters.sizes && filters.sizes.length > 0) {
    filtered = filtered.filter(product => 
      product.sizes && product.sizes.some(size => 
        filters.sizes!.some(fs => fs.toLowerCase() === size.toLowerCase())
      )
    );
  }

  return filtered;
}

/**
 * Sort products based on sort option
 */
export function sortProducts(products: ProductSearchResult[], sortBy: ProductSortBy = 'relevance'): ProductSearchResult[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'relevance':
      return sorted;

    case 'newest':
      // Would need createdAt field
      return sorted;

    case 'price_low':
      return sorted.sort((a, b) => {
        const priceA = a.price ?? Infinity;
        const priceB = b.price ?? Infinity;
        return priceA - priceB;
      });

    case 'price_high':
      return sorted.sort((a, b) => {
        const priceA = a.price ?? -Infinity;
        const priceB = b.price ?? -Infinity;
        return priceB - priceA;
      });

    case 'rating':
      return sorted.sort((a, b) => {
        const ratingA = a.rating ?? -Infinity;
        const ratingB = b.rating ?? -Infinity;
        return ratingB - ratingA;
      });

    case 'most_reviewed':
      return sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));

    default:
      return sorted;
  }
}

