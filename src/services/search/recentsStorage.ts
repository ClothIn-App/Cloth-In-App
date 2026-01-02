/**
 * Recent searches storage module
 * Handles AsyncStorage operations for recent search items
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecentSearchItem = 
  | { type: 'query'; text: string }
  | { type: 'user'; uid: string; username: string; displayName?: string; avatarUrl?: string }
  | { type: 'product'; id: string; name: string; brand?: string; imageUrl?: string }
  | { type: 'fitpic'; id: string; thumbnailUrl?: string; authorUsername?: string };

const RECENT_SEARCHES_KEY = '@clothin:recent_searches';
const MAX_RECENT_SEARCHES = 20;

/**
 * Get recent searches from AsyncStorage
 */
export async function getRecents(): Promise<RecentSearchItem[]> {
  try {
    const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    
    const recents = JSON.parse(stored) as RecentSearchItem[];
    return recents.slice(0, MAX_RECENT_SEARCHES);
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
}

/**
 * Add a recent search item (query text or entity)
 */
export async function addRecent(item: RecentSearchItem): Promise<void> {
  try {
    const recents = await getRecents();
    
    // Remove duplicates (check by type and identifier)
    const filtered = recents.filter(existing => {
      if (item.type === 'query' && existing.type === 'query') {
        return existing.text.toLowerCase() !== item.text.toLowerCase();
      }
      if (item.type === 'user' && existing.type === 'user') {
        return existing.uid !== item.uid;
      }
      if (item.type === 'product' && existing.type === 'product') {
        return existing.id !== item.id;
      }
      if (item.type === 'fitpic' && existing.type === 'fitpic') {
        return existing.id !== item.id;
      }
      return true;
    });
    
    // Add new item at the beginning
    const updated = [item, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export async function clearRecents(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}

