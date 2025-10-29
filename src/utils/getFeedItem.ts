import { FeedItem, FitPicItem, ProductItem } from '../types/feed';
import { buildHomeFeed } from './normalizeFeed';

// Cache for feed items to avoid repeated async calls
let feedItemsCache: FeedItem[] | null = null;
let feedItemsPromise: Promise<FeedItem[]> | null = null;

async function getFeedItems(): Promise<FeedItem[]> {
  if (feedItemsCache) {
    return feedItemsCache;
  }
  
  if (!feedItemsPromise) {
    feedItemsPromise = buildHomeFeed();
  }
  
  feedItemsCache = await feedItemsPromise;
  return feedItemsCache;
}

export async function getFeedItemById(id: string): Promise<FeedItem | null> {
  const items = await getFeedItems();
  return items.find(item => item.id === id) || null;
}

export async function getFitPicById(id: string): Promise<FitPicItem | null> {
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

