import { ImageSourcePropType } from 'react-native';

// Base item interface that all feed items extend
export interface BaseFeedItem {
  id: string;
  type: 'fitpic' | 'product';
  source: ImageSourcePropType;
  createdAt: string;
}

// FitPic specific data
export interface FitPicItem extends BaseFeedItem {
  type: 'fitpic';
  title: string;
  description: string;
  featuredProducts: string[]; // Array of product IDs
  likes: number;
  author: string;
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

// Raw data types from JSON files
export interface RawFitPic {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  featuredProducts: string[];
  likes: number;
  author: string;
  createdAt: string;
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
