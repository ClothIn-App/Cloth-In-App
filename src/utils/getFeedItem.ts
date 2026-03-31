import { FeedItem, FitPicItem, ProductItem, CommentType } from '../types/feed';
import { buildHomeFeed } from './normalizeFeed';
import { contentApiClient } from '../services/apiClients/contentClient';
import { fitpicClient } from '../services/apiClients/fitpicClient';
import { FITPIC_ASSETS } from '../maps/images';
import { Image } from 'react-native';

// Cache for feed items to avoid repeated async calls
let feedItemsCache: FeedItem[] | null = null;
let feedItemsPromise: Promise<FeedItem[]> | null = null;

async function getFeedItems(): Promise<FeedItem[]> {
  if (feedItemsCache) {
    return feedItemsCache;
  }
  
  if (!feedItemsPromise) {
    feedItemsPromise = (async () => {
      // Load feed data from API client and normalize
      const response = await contentApiClient.getFeed({ limit: 100 });
      return buildHomeFeed(response.fitpics, response.products);
    })();
  }
  
  feedItemsCache = await feedItemsPromise;
  return feedItemsCache;
}

export async function getFeedItemById(id: string): Promise<FeedItem | null> {
  const items = await getFeedItems();
  return items.find(item => item.id === id) || null;
}

/**
 * Convert FitPicComment (from API) to CommentType (for UI)
 */
function normalizeComment(rawComment: any): CommentType {
  return {
    id: rawComment.id,
    user: rawComment.user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map(normalizeComment),
    authorId: rawComment.authorId,
    avatarUrl: rawComment.avatarUrl,
    userReaction: rawComment.userReaction,
  };
}

/**
 * Convert FitPic API response to FitPicItem for detail page
 */
async function convertFitPicToFitPicItem(fitpic: any, commentsFromResponse?: CommentType[]): Promise<FitPicItem | null> {
  try {
    const staticSource = FITPIC_ASSETS[fitpic.id];
    const source = staticSource ?? { uri: fitpic.photos?.[0]?.url ?? '' };
    if (!source || (typeof source === 'object' && 'uri' in source && !source.uri)) {
      console.warn(`No image source for FitPic ID: ${fitpic.id}`);
      return null;
    }

    // Get image dimensions: static asset, API photo, or portrait default
    const dimensions = await (async () => {
      if (staticSource) {
        try {
          const resolved = Image.resolveAssetSource(staticSource);
          if (resolved && resolved.width && resolved.height) {
            return { width: resolved.width, height: resolved.height };
          }
        } catch (error) {
          console.warn('Failed to resolve image dimensions:', error);
        }
        return undefined;
      }
      if (fitpic.photos?.[0]?.width != null && fitpic.photos[0].height != null) {
        return {
          width: fitpic.photos[0].width,
          height: fitpic.photos[0].height
        };
      }
      return { width: 4, height: 5 };
    })();

    // Use comments from response/fitpic; server returns comments inside fitpic.comments
    const rawComments = commentsFromResponse ?? fitpic.comments ?? [];
    const comments: CommentType[] = Array.isArray(rawComments)
      ? rawComments.map((c: any) => normalizeComment(c))
      : [];

    // Convert location object to string
    const locationString = fitpic.location 
      ? (typeof fitpic.location === 'string' ? fitpic.location : fitpic.location.name)
      : undefined;

    // Convert engagement to reaction counts (API has likes, dislikes, heart, fire)
    const engagement = fitpic.engagement;
    const reactions = engagement?.reactions && Array.isArray(engagement.reactions)
      ? engagement.reactions.reduce((acc: any, r: any) => {
          acc.counts[r.emoji as keyof typeof acc.counts] = r.count;
          return acc;
        }, { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } })
      : {
          counts: {
            LIKE: engagement?.heart ?? 0,
            THUMBS_UP: engagement?.likes ?? 0,
            FIRE: engagement?.fire ?? 0,
            DISLIKE: engagement?.dislikes ?? 0,
          },
        };

    const sources = fitpic.photos?.map((p: any) => p.url).filter(Boolean) ?? [];

    return {
      id: fitpic.id,
      type: 'fitpic',
      source,
      caption: fitpic.caption || '',
      featuredProducts: {
        total: fitpic.products?.length || 0,
        productIds: fitpic.products?.map((p: any) => p.id) || []
      },
      likes: fitpic.engagement?.likes || 0,
      author: fitpic.author?.username || fitpic.authorId,
      authorId: fitpic.authorId || fitpic.author?.uid,
      authorAvatarUrl: fitpic.author?.avatarUrl,
      createdAt: fitpic.createdAt,
      location: locationString,
      reactions,
      comments,
      userReaction: fitpic.engagement?.userReaction,
      isSaved: fitpic.engagement?.isSaved,
      ...dimensions,
      sources
    };
  } catch (error) {
    console.error('Error converting FitPic to FitPicItem:', error);
    return null;
  }
}

export async function getFitPicById(id: string): Promise<FitPicItem | null> {
  // First try to get from API endpoint (has full data including products and comments)
  try {
    const response = await fitpicClient.getById(id) as any;
    if (response.success && response.fitpic) {
      // Server returns comments inside fitpic.comments (not top-level response.comments)
      const fitpic = response.fitpic;
      const commentsSource = fitpic.comments ?? response.comments;
      const fitpicItem = await convertFitPicToFitPicItem(fitpic, commentsSource);
      if (fitpicItem) {
        return fitpicItem;
      }
    }
  } catch (error) {
    console.warn('Failed to load FitPic from API, trying feed cache:', error);
  }

  // Fallback to feed cache
  const item = await getFeedItemById(id);
  return item && item.type === 'fitpic' ? item : null;
}

/** Fetch product by ID from API and return as FeedItem (for saved tab in real mode). */
export async function getProductByIdFromApi(id: string): Promise<ProductItem | null> {
  try {
    const response = await contentApiClient.getProduct(id);
    const p = response?.product as any;
    if (!p) return null;
    // API returns primaryImageUrl (string) and images (array of { url }) — not imagePath
    const imageUrl =
      p.primaryImageUrl ??
      (Array.isArray(p.images) && p.images[0]?.url ? p.images[0].url : undefined) ??
      p.imagePath ??
      '';
    return {
      id: p.id,
      type: 'product',
      source: { uri: imageUrl || '' },
      createdAt: (p as any).createdAt ?? '',
      name: p.name ?? '',
      brand: p.brand ?? '',
      price: p.price ?? 0,
      salePrice: p.originalPrice ?? null,
      priceType: p.priceType,
      category: (p as any).category ?? '',
      description: p.description ?? '',
    };
  } catch (error) {
    console.warn('Failed to load product from API:', error);
    return null;
  }
}

export async function getProductById(id: string): Promise<ProductItem | null> {
  const item = await getFeedItemById(id);
  return item && item.type === 'product' ? item : null;
}

export function clearFeedCache() {
  feedItemsCache = null;
  feedItemsPromise = null;
}

