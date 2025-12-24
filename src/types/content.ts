// Product and FitPic types matching the mock data structure

// Reaction counts type
export type ReactionCounts = {
  LIKE: number;
  THUMBS_UP: number;
  FIRE: number;
  DISLIKE: number;
};

// Reactions type
export type Reactions = {
  counts: ReactionCounts;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  imagePath: string;
  description: string;
  specs?: string;
  productUrl?: string;
  images?: string[];
  reactions?: Reactions;
  comments?: FitPicComment[]; // Product comments use the same structure as FitPic comments
};

// Comment type for FitPic comments (matching mock structure)
export type FitPicComment = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
  like: number;
  dislike: number;
  replies: FitPicComment[];
};

export type FitPic = {
  id: string;
  author: string;
  caption?: string;
  imagePath: string;
  featuredProducts: string[];
  featuredProductIds?: string[];
  productsUsed: string[]; // MUST be present and used to link products to fitpics (derived from featuredProductIds or featuredProducts)
  createdAt: string;
  location?: string;
  reactions: Reactions;
  comments?: FitPicComment[];
};
