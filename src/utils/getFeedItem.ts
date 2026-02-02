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
 * Convert FitPicComment (from mock data) to CommentType (for UI)
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
  };
}

/**
 * Convert FitPic API response to FitPicItem for detail page
 */
async function convertFitPicToFitPicItem(fitpic: any, commentsFromResponse?: CommentType[]): Promise<FitPicItem | null> {
  try {
    const source = FITPIC_ASSETS[fitpic.id];
    if (!source) {
      console.warn(`No asset found for FitPic ID: ${fitpic.id}`);
      return null;
    }

    // Get image dimensions
    const dimensions = await (async () => {
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
    })();

    // Use comments from response if provided, otherwise empty array
    const comments: CommentType[] = commentsFromResponse || [];

    // Convert location object to string
    const locationString = fitpic.location 
      ? (typeof fitpic.location === 'string' ? fitpic.location : fitpic.location.name)
      : undefined;

    // Convert reactions
    const reactions = fitpic.engagement?.reactions && Array.isArray(fitpic.engagement.reactions)
      ? fitpic.engagement.reactions.reduce((acc: any, r: any) => {
          acc.counts[r.emoji as keyof typeof acc.counts] = r.count;
          return acc;
        }, { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } })
      : { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } };

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
      authorId: fitpic.authorId || fitpic.author?.uid, // Preserve authorId for navigation
      createdAt: fitpic.createdAt,
      location: locationString,
      reactions,
      comments,
      ...dimensions
    };
  } catch (error) {
    console.error('Error converting FitPic to FitPicItem:', error);
    return null;
  }
}

export async function getFitPicById(id: string): Promise<FitPicItem | null> {
  // First try to get from API endpoint (has full data including products and comments)
  try {
    const response = await fitpicClient.getById(id) as any; // Type assertion needed because response includes comments
    if (response.success && response.fitpic) {
      const fitpicItem = await convertFitPicToFitPicItem(response.fitpic, response.comments);
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

export async function getProductById(id: string): Promise<ProductItem | null> {
  const item = await getFeedItemById(id);
  return item && item.type === 'product' ? item : null;
}

export function clearFeedCache() {
  feedItemsCache = null;
  feedItemsPromise = null;
}

