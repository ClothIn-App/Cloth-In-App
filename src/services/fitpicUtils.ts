/**
 * Pure transformation utilities for FitPic data
 * These functions accept data as parameters - no JSON imports allowed.
 */

import { Image } from 'react-native';
import { FITPIC_ASSETS } from '../maps/images';
import type { FitPic, FitPicSortOptions, FitPicFilters } from '../types/fitpic';

/**
 * Helper to get image URI from asset
 */
export function getImageUri(source: any): string | undefined {
  if (typeof source === 'number') {
    // require() returns a number, resolve it
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri;
  }
  if (source?.uri) {
    return source.uri;
  }
  return undefined;
}

/**
 * Transform raw FitPic data to FitPic type
 * Pure function - accepts raw data and user/products data as parameters
 */
export function transformRawFitPic(
  rawFitpic: any,
  userData: any,
  products: any[]
): FitPic | null {
  try {
    const imageSource = FITPIC_ASSETS[rawFitpic.id];
    if (!imageSource) {
      console.warn(`No asset found for FitPic ID: ${rawFitpic.id}`);
      return null;
    }

    const imageUri = getImageUri(imageSource);
    if (!imageUri) {
      console.warn(`Could not resolve image URI for FitPic ID: ${rawFitpic.id}`);
      return null;
    }

    // Get image dimensions
    const resolved = Image.resolveAssetSource(imageSource);
    const width = resolved?.width || 800;
    const height = resolved?.height || 1000;

    // Get user data for author info
    const author = userData ? {
      uid: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      avatarUrl: userData.avatarUrl,
    } : {
      uid: rawFitpic.author || 'unknown',
      username: rawFitpic.author || 'unknown',
      displayName: rawFitpic.author || 'unknown',
    };

    // Transform products from productIds to ProductLite format
    const transformedProducts = (rawFitpic.featuredProducts?.productIds || []).map((productId: string) => {
      const product = products.find((p: any) => p.id === productId);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: (product as any).category, // Category may not exist in all products
        price: product.price,
        currency: 'USD',
        imageUrl: undefined, // Could be added if needed
        purchaseUrl: product.productUrl,
      };
    }).filter((p: any): p is NonNullable<typeof p> => p !== null);

    // Transform reactions to engagement
    const reactions = rawFitpic.reactions?.counts || {};
    const engagement = {
      likes: reactions.LIKE || 0,
      saves: 0, // Not in raw data
      comments: rawFitpic.comments?.length || 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
      reactions: Object.entries(reactions).map(([emoji, count]) => ({
        emoji: emoji === 'LIKE' ? '👍' : emoji === 'THUMBS_UP' ? '👍' : emoji === 'FIRE' ? '🔥' : '👎',
        count: count as number,
        users: [],
      })),
    };

    const fitpic: FitPic = {
      id: rawFitpic.id,
      authorId: rawFitpic.author,
      author,
      photos: [{
        id: `${rawFitpic.id}-photo-0`,
        url: imageUri,
        thumbnailUrl: imageUri,
        index: 0,
        isCover: true,
        width,
        height,
      }],
      caption: rawFitpic.caption || '',
      products: transformedProducts,
      createdAt: rawFitpic.createdAt || new Date().toISOString(),
      engagement,
      location: rawFitpic.location ? {
        name: rawFitpic.location,
      } : undefined,
      isPublic: true,
    };

    return fitpic;
  } catch (error) {
    console.error(`Error transforming FitPic ${rawFitpic.id}:`, error);
    return null;
  }
}

/**
 * Helper function to sort fitpics
 * Pure function - accepts fitpics array and sort option
 */
export function sortFitPics(fitpics: FitPic[], sort: FitPicSortOptions): FitPic[] {
  const sorted = [...fitpics];
  
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'most_liked':
      return sorted.sort((a, b) => b.engagement.likes - a.engagement.likes);
    case 'most_saved':
      return sorted.sort((a, b) => b.engagement.saves - a.engagement.saves);
    case 'trending':
      // Simple trending algorithm: combination of recent likes and recency
      return sorted.sort((a, b) => {
        const aScore = a.engagement.likes + (new Date().getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const bScore = b.engagement.likes + (new Date().getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return bScore - aScore;
      });
    default:
      return sorted;
  }
}

/**
 * Helper function to filter fitpics
 * Pure function - accepts fitpics array and filters
 */
export function filterFitPics(fitpics: FitPic[], filters?: FitPicFilters): FitPic[] {
  if (!filters) return fitpics;
  
  return fitpics.filter(fitpic => {
    if (filters.userId && fitpic.authorId !== filters.userId) return false;
    if (filters.hasProducts && fitpic.products.length === 0) return false;
    if (filters.dateRange) {
      const fitpicDate = new Date(fitpic.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (fitpicDate < startDate || fitpicDate > endDate) return false;
    }
    if (filters.engagement) {
      if (filters.engagement.minLikes && fitpic.engagement.likes < filters.engagement.minLikes) return false;
      if (filters.engagement.minSaves && fitpic.engagement.saves < filters.engagement.minSaves) return false;
    }
    return true;
  });
}

