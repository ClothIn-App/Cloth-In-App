/**
 * Data transformation mappers
 * Converts canonical mock data to search result format
 */

import type { FitPicSearchResult, ProductSearchResult } from '../../types/search';
import fitpicsData from '../../mocks/mock-fitpics.json';
import productsData from '../../mocks/mock-products.json';
import { FITPIC_ASSETS, PRODUCT_ASSETS } from '../../maps/images';
import { getImageUri } from './assetHelpers';

/**
 * Transform canonical FitPic data to FitPicSearchResult format
 */
export function transformFitPicToSearchResult(fitpic: any): FitPicSearchResult {
  const imageSource = FITPIC_ASSETS[fitpic.id];
  const imageUri = imageSource ? getImageUri(imageSource) : undefined;
  
  // Extract hashtags from caption if present
  const hashtags = fitpic.caption 
    ? (fitpic.caption.match(/#\w+/g) || []).map((tag: string) => tag.substring(1))
    : [];

  return {
    id: fitpic.id,
    authorId: fitpic.author || 'unknown',
    author: {
      uid: fitpic.author || 'unknown',
      username: fitpic.author || 'unknown',
      displayName: fitpic.author || 'unknown',
    },
    photos: imageUri ? [{
      id: `${fitpic.id}-photo-0`,
      url: imageUri,
      thumbnailUrl: imageUri, // Use same URI for thumbnail
      index: 0,
      isCover: true,
    }] : [],
    caption: fitpic.caption || '',
    products: (fitpic.featuredProducts?.productIds || []).map((productId: string) => {
      const product = productsData.products.find((p: any) => p.id === productId);
      if (!product) return null;
      const productImageSource = PRODUCT_ASSETS[productId];
      const productImageUri = productImageSource ? getImageUri(productImageSource) : undefined;
      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        imageUrl: productImageUri,
      };
    }).filter((p: ProductSearchResult | null): p is ProductSearchResult => p !== null),
    createdAt: fitpic.createdAt || new Date().toISOString(),
    engagement: {
      likes: fitpic.reactions?.counts?.LIKE || 0,
      saves: 0, // Not in canonical data
      comments: fitpic.comments?.length || 0,
    },
    hashtags: hashtags.length > 0 ? hashtags : undefined,
  };
}

/**
 * Transform canonical Product data to ProductSearchResult format
 */
export function transformProductToSearchResult(product: any): ProductSearchResult {
  const imageSource = PRODUCT_ASSETS[product.id];
  const imageUri = imageSource ? getImageUri(imageSource) : undefined;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    originalPrice: product.salePrice ? product.price : undefined,
    currency: 'USD',
    priceStatus: product.price ? 'Fixed' : 'TBD',
    imageUrl: imageUri,
    purchaseUrl: product.productUrl,
    rating: null, // Not in canonical data
    reviewCount: undefined,
    isAvailable: true,
    description: product.description,
    tags: [], // Can be derived from category or other fields if needed
  };
}

