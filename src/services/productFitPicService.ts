/**
 * ProductFitPicService
 * Service to connect products with fitpics and find featured fitpics for products
 */

import fitpicsData from '../mocks/fitpics.json';
import type { FitPic } from '../types/fitpic';
import type { ProductSearchResult } from '../types/search';

const fitpics: FitPic[] = fitpicsData.fitpics;

/**
 * Get fitpics that feature a specific product
 */
export function getFitPicsForProduct(productId: string): FitPic[] {
  try {
    if (!productId) return [];
    return fitpics.filter(fitpic => 
      fitpic.products && fitpic.products.some(product => product.id === productId)
    );
  } catch (error) {
    console.warn('Error getting fitpics for product:', error);
    return [];
  }
}

/**
 * Get products featured in a specific fitpic
 */
export function getProductsForFitPic(fitpicId: string): ProductSearchResult[] {
  const fitpic = fitpics.find(f => f.id === fitpicId);
  if (!fitpic) return [];
  
  // Convert ProductLite to ProductSearchResult
  return fitpic.products.map(product => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    currency: product.currency,
    imageUrl: product.imageUrl,
    purchaseUrl: product.purchaseUrl,
  }));
}

/**
 * Get all fitpics (for the mixed feed)
 */
export function getAllFitPics(): FitPic[] {
  return fitpics;
}

/**
 * Get all products (for the mixed feed)
 */
export function getAllProducts(): ProductSearchResult[] {
  // This would typically come from a products API
  // For now, we'll extract unique products from fitpics
  const productMap = new Map<string, ProductSearchResult>();
  
  fitpics.forEach(fitpic => {
    fitpic.products.forEach(product => {
      if (!productMap.has(product.id)) {
        productMap.set(product.id, {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          currency: product.currency,
          imageUrl: product.imageUrl,
          purchaseUrl: product.purchaseUrl,
        });
      }
    });
  });
  
  return Array.from(productMap.values());
}
