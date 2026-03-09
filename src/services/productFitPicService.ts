/**
 * ProductFitPicService
 * Service to connect products with fitpics and find featured fitpics for products
 * Uses API clients instead of direct JSON imports
 */

import type { FitPic, ProductLite } from '../types/fitpic';
import type { ProductSearchResult, ProductImage } from '../types/search';
import type { Product } from '../types/content';
import { contentApiClient } from './apiClients/contentClient';
import { fitpicClient } from './apiClients/fitpicClient';

/**
 * Get fitpics that feature a specific product
 */
export async function getFitPicsForProduct(productId: string): Promise<FitPic[]> {
  try {
    if (!productId) return [];
    
    // Load fitpics via API client
    const response = await contentApiClient.getFitPics({});
    const fitpics = response.fitpics || [];
    
    return fitpics.filter(fitpic =>
      fitpic.products && fitpic.products.some((product: ProductLite) => product.id === productId)
    );
  } catch (error) {
    console.warn('Error getting fitpics for product:', error);
    return [];
  }
}

/**
 * Get products featured in a specific fitpic
 */
export async function getProductsForFitPic(fitpicId: string): Promise<ProductSearchResult[]> {
  try {
    const response = await fitpicClient.getById(fitpicId);
    if (!response.success || !response.fitpic) return [];
    
    const fitpic = response.fitpic;
    
    // Convert ProductLite to ProductSearchResult
    return fitpic.products.map((product: ProductLite) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
      purchaseUrl: product.purchaseUrl,
    }));
  } catch (error) {
    console.warn('Error getting products for fitpic:', error);
    return [];
  }
}

/**
 * Get all fitpics (for the mixed feed)
 */
export async function getAllFitPics(): Promise<FitPic[]> {
  try {
    const response = await contentApiClient.getFitPics({});
    return response.fitpics || [];
  } catch (error) {
    console.warn('Error getting all fitpics:', error);
    return [];
  }
}

/**
 * Map API Product to ProductSearchResult (content API returns Product[], we expose ProductSearchResult[]).
 */
function mapProductToSearchResult(product: Product): ProductSearchResult {
  const images: ProductImage[] | undefined = product.images?.map((url, i) => ({
    id: `img-${product.id}-${i}`,
    url,
  }));
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    originalPrice: product.originalPrice,
    imageUrl: product.imagePath,
    purchaseUrl: product.productUrl ?? null,
    images,
    description: product.description,
    specifications: product.specs,
  };
}

/**
 * Get all products (for the mixed feed)
 */
export async function getAllProducts(): Promise<ProductSearchResult[]> {
  try {
    const response = await contentApiClient.getProducts({});
    const products = response.products || [];
    return products.map(mapProductToSearchResult);
  } catch (error) {
    console.warn('Error getting all products:', error);
    return [];
  }
}
