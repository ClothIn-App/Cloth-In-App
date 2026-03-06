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

type ProductLike = {
  id: string;
  name: string;
  brand?: string;
  price?: number | null;
  originalPrice?: number;
  priceType?: 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';
  description?: string;
  imageUrl?: string | null;
  createdAt?: string;
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
  const staticSource = PRODUCT_ASSETS[product.id];
  const source = staticSource ?? { uri: product.imageUrl ?? "" };
  if (!source || (typeof source === "object" && "uri" in source && !source.uri)) {
    throw new Error(`No image source for Product ID: ${product.id}`);
  }

  // Products don't need dimensions since they're always square in the grid
  // The grid layout will handle the sizing based on column width

  const price = product.price || 0;
  const salePrice = product.priceType === 'sale' && product.originalPrice
    ? price
    : null;

  return {
    id: product.id,
    type: 'product',
    source,
    name: product.name,
    brand: product.brand || '',
    price: product.priceType === 'sale' && product.originalPrice ? product.originalPrice : price,
    salePrice,
    priceType: product.priceType,
    category: '',
    description: product.description || '',
    createdAt: product.createdAt || new Date().toISOString(),
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
    const fitpicsArray = fitpics || [];
    const productsArray = products || [];

    // Use allSettled so one failing item (e.g. missing image) does not empty the feed
    const [fitpicResults, productResults] = await Promise.all([
      Promise.allSettled(fitpicsArray.map(normalizeFitPic)),
      Promise.allSettled(productsArray.map(normalizeProduct)),
    ]);

    const normalizedFitPics: FitPicItem[] = fitpicResults
      .filter((r): r is PromiseFulfilledResult<FitPicItem> => r.status === "fulfilled" && r.value != null)
      .map((r) => r.value);

    const normalizedProducts: ProductItem[] = productResults
      .filter((r): r is PromiseFulfilledResult<ProductItem> => r.status === "fulfilled" && r.value != null)
      .map((r) => r.value);

    productResults.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`Feed: skipped product at index ${i}:`, r.reason?.message ?? r.reason);
      }
    });
    fitpicResults.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`Feed: skipped fitpic at index ${i}:`, r.reason?.message ?? r.reason);
      }
    });

    const allItems: FeedItem[] = [...normalizedFitPics, ...normalizedProducts];
    return allItems.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error building home feed:", error);
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
