/**
 * Shared filtering utilities for search endpoints
 * Ensures consistent filtering logic across searchTop and category-specific endpoints
 * 
 * These are pure functions that accept data as parameters - no JSON imports allowed.
 */

import type { FitPicSearchResult, UserSearchResult, ProductSearchResult } from '../../types/search';
import { transformFitPicToSearchResult, transformProductToSearchResult } from './mappers';

/**
 * Matches a query string against text using word-based matching
 */
export function matchesQuery(
  qLower: string,
  text: string | undefined | null
): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();
  if (textLower.includes(qLower)) return true;
  const queryWords = qLower.split(/[\s_]+/).filter((w) => w.length > 0);
  const textWords = textLower.split(/[\s_]+/).filter((w) => w.length > 0);
  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Filter fitpics using the same logic as searchTop
 * Pure function - accepts data as parameters
 */
export function filterFitPics(
  fitpics: any[],
  products: any[],
  query: string,
  userId?: string
): FitPicSearchResult[] {
  const q = query.toLowerCase().trim();
  
  // If query is too short, return empty (matching searchTop behavior)
  if (!q || q.length < 2) {
    return [];
  }
  
  const canonicalFitpics = fitpics.filter((fitpic: any) => {
    // Filter by user if provided
    if (userId && fitpic.author !== userId) {
      return false;
    }

    // Apply same filtering logic as searchTop
    const captionMatch = matchesQuery(q, fitpic.caption);
    const authorMatch = matchesQuery(q, fitpic.author);
    const hashtags = fitpic.caption
      ? (fitpic.caption.match(/#\w+/g) || []).map((tag: string) =>
          tag.substring(1).toLowerCase()
        )
      : [];
    const hashtagMatch = hashtags.some(
      (tag) => tag.includes(q) || q.includes(tag)
    );
    const productMatch = (
      fitpic.featuredProducts?.productIds || []
    ).some((productId: string) => {
      const product = products.find(
        (p: any) => p.id === productId
      );
      if (!product) return false;
      return (
        matchesQuery(q, product.name) ||
        matchesQuery(q, product.brand) ||
        matchesQuery(q, product.description)
      );
    });
    const captionWords = (fitpic.caption || "")
      .toLowerCase()
      .split(/\s+/);
    const keywordMatch = captionWords.some(
      (word) => word.includes(q) || q.includes(word)
    );
    return (
      captionMatch ||
      authorMatch ||
      hashtagMatch ||
      productMatch ||
      keywordMatch
    );
  });

  return canonicalFitpics.map((fitpic: any) => transformFitPicToSearchResult(fitpic, products));
}

/**
 * Filter users using the same logic as searchTop
 * Pure function - accepts data as parameters
 */
export function filterUsers(users: any[], query: string): UserSearchResult[] {
  const q = query.toLowerCase().trim();

  // If query is too short, return empty (matching searchTop behavior)
  if (!q || q.length < 2) {
    return [];
  }

  const filteredUsers: UserSearchResult[] = Object.values(users as Record<string, any>)
    .filter((user: any) => {

      // Apply same filtering logic as searchTop
      const usernameMatch = matchesQuery(q, user.username);
      const displayNameMatch = matchesQuery(q, user.displayName);
      const bioMatch = matchesQuery(q, user.bio);
      const displayNameWords = (user.displayName || "")
        .toLowerCase()
        .split(/\s+/);
      const nameMatch = displayNameWords.some(
        (name) => name.includes(q) || q.includes(name)
      );
      return usernameMatch || displayNameMatch || bioMatch || nameMatch;
    })
    .map(
      (user: any): UserSearchResult => ({
        id: user.id,
        uid: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isFollowing: false,
        followerCount: user.followers?.total || 0,
        verified: user.isVerified || false,
      })
    );

  return filteredUsers;
}

/**
 * Filter products using the same logic as searchTop
 * Pure function - accepts data as parameters
 */
export function filterProducts(products: any[], query: string): ProductSearchResult[] {
  const q = query.toLowerCase().trim();

  // If query is too short, return empty (matching searchTop behavior)
  if (!q || q.length < 2) {
    return [];
  }

  const canonicalProducts = products.filter(
    (product: any) => {

      // Apply same filtering logic as searchTop
      const nameMatch = matchesQuery(q, product.name);
      const brandMatch = matchesQuery(q, product.brand);
      const descMatch = matchesQuery(q, product.description);
      const categoryMatch = matchesQuery(q, product.category);
      const nameWords = (product.name || "")
        .toLowerCase()
        .split(/\s+/);
      const brandWords = (product.brand || "")
        .toLowerCase()
        .split(/\s+/);
      const keywordMatch =
        nameWords.some(
          (word) => word.includes(q) || q.includes(word)
        ) ||
        brandWords.some(
          (word) => word.includes(q) || q.includes(word)
        );
      return nameMatch || brandMatch || descMatch || categoryMatch || keywordMatch;
    }
  );

  return canonicalProducts.map(transformProductToSearchResult);
}

