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

export type ProductPriceType = 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';

export type Product = {
  id: string;
  name: string;
  brand: string;
  /** Category path or label from API (optional in legacy mocks). */
  category?: string;
  /** Canonical brand id when product matches API / emulator shape (optional in legacy mocks). */
  brandId?: string;
  brandNameCanonical?: string;
  color?: string;
  price: number;
  originalPrice?: number;
  priceType?: ProductPriceType;
  imagePath: string;
  description: string;
  specs?: string;
  productUrl?: string;
  images?: string[];
  reactions?: Reactions;
  comments?: FitPicComment[];
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
  featuredProducts: {
    total: number;
    productIds: string[];
  };
  productsUsed: string[]; // MUST be present and used to link products to fitpics (derived from featuredProducts.productIds)
  createdAt: string;
  location?: string;
  reactions: Reactions;
  comments?: FitPicComment[];
};
