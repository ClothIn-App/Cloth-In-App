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
  reactions: Reactions;
  comments?: CommentType[]; // Optional comments array
  location?: string; // Optional location string (e.g., "New York, NY")
  // Intrinsic dimensions for proper grid layout
  width?: number;
  height?: number;
}

// Product specific data
export interface ProductItem extends BaseFeedItem {
  type: 'product';
  name: string;
  brand: string;
  price: number;
  salePrice: number | null;
  category: string;
  description: string;
  // Intrinsic dimensions for proper grid layout
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
