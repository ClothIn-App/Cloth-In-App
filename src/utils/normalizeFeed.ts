import { Image } from 'react-native';
import { 
  FeedItem, 
  FitPicItem, 
  ProductItem
} from '../types/feed';
import type { FitPic } from '../types/fitpic';
import type { Product } from '../types/content';
import type { ProductSearchResult } from '../types/search';
import { FITPIC_ASSETS, PRODUCT_ASSETS } from '../maps/images';

// Generic product type that both Product and ProductSearchResult satisfy
type ProductLike = {
  id: string;
  name: string;
  brand?: string;
  price?: number | null;
  description?: string;
};

// Get image dimensions using Image.resolveAssetSource
const getImageDimensions = async (source: any): Promise<{ width: number; height: number } | undefined> => {
  try {
    const resolved = Image.resolveAssetSource(source);
    if (resolved && resolved.width && resolved.height) {
      return {
        width: resolved.width,
        height: resolved.height
      };
    }
  } catch (error) {
    console.warn('Failed to resolve image dimensions:', error);
  }
  return undefined;
};

// Recursive helper to normalize comments (convert 'like' to 'likes', 'dislike' to 'dislikes')
const normalizeComment = (rawComment: any): any => {
  return {
    id: rawComment.id,
    user: rawComment.user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map(normalizeComment),
  };
};

// Convert FitPic API type to FitPicItem
const normalizeFitPic = async (fitpic: FitPic): Promise<FitPicItem> => {
  const staticSource = FITPIC_ASSETS[fitpic.id];
  const source = staticSource ?? { uri: fitpic.photos?.[0]?.url ?? '' };

  // Dimensions: from static asset or from API photo; fallback to portrait ratio for legacy fitpics
  let dimensions: { width?: number; height?: number } = {};
  if (staticSource) {
    const resolved = await getImageDimensions(staticSource);
    if (resolved) dimensions = resolved;
  } else if (fitpic.photos?.[0]?.width != null && fitpic.photos[0].height != null) {
    dimensions = { width: fitpic.photos[0].width, height: fitpic.photos[0].height };
  } else {
    // No dimensions (e.g. existing fitpics before dimensions were stored): use portrait aspect so grid doesn't assume square
    dimensions = { width: 4, height: 5 };
  }

  // Convert location object to string if needed
  const locationString = fitpic.location 
    ? (typeof fitpic.location === 'string' ? fitpic.location : fitpic.location.name)
    : undefined;

  // Convert engagement to reaction counts (API has likes, dislikes, heart, fire)
  const engagement = fitpic.engagement;
  const reactions = engagement?.reactions && Array.isArray(engagement.reactions)
    ? engagement.reactions.reduce((acc, r) => {
        acc.counts[r.emoji as keyof typeof acc.counts] = r.count;
        return acc;
      }, { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } })
    : {
        counts: {
          LIKE: engagement?.likes ?? 0,
          THUMBS_UP: engagement?.heart ?? 0,
          FIRE: engagement?.fire ?? 0,
          DISLIKE: engagement?.dislikes ?? 0,
        },
      };

  return {
    id: fitpic.id,
    type: 'fitpic',
    source,
    caption: fitpic.caption || '',
    featuredProducts: {
      total: fitpic.products?.length || 0,
      productIds: fitpic.products?.map(p => p.id) || []
    },
    likes: fitpic.engagement?.likes || 0,
    author: fitpic.author?.username ?? fitpic.authorId ?? '',
    createdAt: fitpic.createdAt,
    location: locationString,
    reactions,
    comments: undefined, // Comments would need to be loaded separately if needed
    ...dimensions
  };
};

// Convert Product-like API type to ProductItem
// Accepts both Product and ProductSearchResult types
const normalizeProduct = async (product: ProductLike): Promise<ProductItem> => {
  const source = PRODUCT_ASSETS[product.id];
  if (!source) {
    throw new Error(`No asset found for Product ID: ${product.id}`);
  }

  // Products don't need dimensions since they're always square in the grid
  // The grid layout will handle the sizing based on column width

  return {
    id: product.id,
    type: 'product',
    source,
    name: product.name,
    brand: product.brand || '',
    price: product.price || 0,
    salePrice: null, // Set to null for now
    category: '', // Not available in ProductLike
    description: product.description || '',
    createdAt: new Date().toISOString(), // Not available in ProductLike
    // No dimensions needed for products - they're always square
  };
};

/**
 * Build unified home feed from API data
 * Pure function - accepts FitPic[] and Product-like[] as parameters, no JSON imports
 */
export const buildHomeFeed = async (
  fitpics: FitPic[] | undefined,
  products: ProductLike[] | undefined
): Promise<FeedItem[]> => {
  try {
    // Handle undefined/null arrays
    const fitpicsArray = fitpics || [];
    const productsArray = products || [];

    // Normalize all items in parallel
    const [normalizedFitPics, normalizedProducts] = await Promise.all([
      Promise.all(fitpicsArray.map(normalizeFitPic)),
      Promise.all(productsArray.map(normalizeProduct))
    ]);

    // Combine and sort by creation date (newest first)
    const allItems: FeedItem[] = [...normalizedFitPics, ...normalizedProducts];
    
    return allItems.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error building home feed:', error);
    return [];
  }
};

/**
 * Build FitPic feed from API data
 * Pure function - accepts FitPic[] as parameter
 */
export const buildFitPicFeed = async (fitpics: FitPic[] | undefined): Promise<FitPicItem[]> => {
  try {
    const fitpicsArray = fitpics || [];
    return Promise.all(fitpicsArray.map(normalizeFitPic));
  } catch (error) {
    console.error('Error building FitPic feed:', error);
    return [];
  }
};

/**
 * Build Product feed from API data
 * Pure function - accepts Product-like[] as parameter
 */
export const buildProductFeed = async (products: ProductLike[] | undefined): Promise<ProductItem[]> => {
  try {
    const productsArray = products || [];
    return Promise.all(productsArray.map(normalizeProduct));
  } catch (error) {
    console.error('Error building product feed:', error);
    return [];
  }
};
