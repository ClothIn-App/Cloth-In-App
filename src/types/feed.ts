import { ImageSourcePropType } from 'react-native';

// Base item interface that all feed items extend
export interface BaseFeedItem {
  id: string;
  type: 'fitpic' | 'product';
  source: ImageSourcePropType;
  createdAt: string;
}

// Comment type for FitPic comments
export interface CommentType {
  id: string;
  user: string;
  text: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  replies: CommentType[];
  authorId?: string; // When set, use for navigation; user is display username
  avatarUrl?: string; // Avatar URL of the comment author
  /** Current user's reaction when auth present (like | dislike) */
  userReaction?: string;
}

// FitPic specific data
export interface FitPicItem extends BaseFeedItem {
  type: 'fitpic';
  caption: string;
  featuredProducts: {
    total: number;
    productIds: string[];
  };
  likes: number;
  author: string;
  authorId?: string; // Optional authorId for navigation (when author is username string)
  authorAvatarUrl?: string; // Avatar URL of the post author
  reactions: Reactions;
  comments?: CommentType[]; // Optional comments array
  location?: string; // Optional location string (e.g., "New York, NY")
  /** Current user's reaction when auth present (LIKE | THUMBS_UP | FIRE | DISLIKE) */
  userReaction?: string;
  /** Whether the current user has saved this fitpic (from API when auth present) */
  isSaved?: boolean;
  // Intrinsic dimensions for proper grid layout
  width?: number;
  height?: number;
  /** Ordered photo URLs when loaded from API (for detail screen carousel) */
  sources?: string[];
}

// Product specific data
export interface ProductItem extends BaseFeedItem {
  type: 'product';
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  priceType?: 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';
  category: string;
  description: string;
  width?: number;
  height?: number;
}

// Union type for all possible feed items
export type FeedItem = FitPicItem | ProductItem;

// Reaction types
export type ReactionKey = 'LIKE' | 'THUMBS_UP' | 'FIRE' | 'DISLIKE';

export type ReactionCounts = Record<ReactionKey, number>;

export interface Reactions {
  counts: ReactionCounts;
}

// Raw data types from JSON files
export interface RawFitPic {
  id: string;
  author: string;
  caption: string;
  imagePath: string;
  featuredProducts: {
    total: number;
    productIds: string[];
  };
  likes: number;
  createdAt: string;
  location?: string; // Optional location string (e.g., "New York, NY")
  reactions: Reactions;
  comments?: any[]; // Raw comments from JSON (will be normalized)
}

export interface RawProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  priceType?: 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';
  originalPrice?: number;
  imagePath: string;
  category: string;
  description: string;
}

export interface RawFitPicsData {
  fitpics: RawFitPic[];
}

export interface RawProductsData {
  products: RawProduct[];
}
