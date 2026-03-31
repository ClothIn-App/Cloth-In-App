// Search-related types for the search functionality

export type SearchCategory = 'all' | 'users' | 'fitpics' | 'products' | 'hashtags';

export type SearchSuggestion = {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
  category?: SearchCategory;
  count?: number; // For trending items
};

export type UserSearchResult = {
  id: string;
  uid: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  isFollowing?: boolean;
  followerCount?: number;
  verified?: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  alt?: string;
};

export type ProductPriceStatus = 'Fixed' | 'Sale' | 'Sold Out' | 'TBD' | 'N/A';

export type ProductReaction = {
  emoji: string;
  count: number;
  users: string[]; // user IDs who reacted with this emoji
};

export type ProductSearchResult = {
  id: string;
  name: string;
  brand?: string;
  brandId?: string;
  brandNameCanonical?: string;
  category?: string;
  price?: number | null;
  originalPrice?: number;
  currency?: string;
  priceStatus?: ProductPriceStatus;
  images?: ProductImage[];
  imageUrl?: string;
  purchaseUrl?: string | null;
  rating?: number | null;
  reviewCount?: number;
  isAvailable?: boolean;
  colors?: string[];
  sizes?: string[];
  description?: string;
  specifications?: string;
  tags?: string[];
  reactions?: ProductReaction[];
  userReactions?: string[]; // emojis the current user has reacted with
};

export type HashtagSearchResult = {
  tag: string;
  postCount: number;
  isTrending?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
};

export type FitPicSearchResult = {
  id: string;
  authorId: string;
  author: {
    uid: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  photos: {
    id: string;
    url: string;
    thumbnailUrl?: string;
    index: number;
    isCover: boolean;
  }[];
  caption: string;
  products: ProductSearchResult[];
  createdAt: string;
  engagement: {
    likes: number;
    saves: number;
    comments: number;
  };
  hashtags?: string[];
};

export type SearchResult = {
  users: UserSearchResult[];
  fitpics: FitPicSearchResult[];
  products: ProductSearchResult[];
  hashtags: HashtagSearchResult[];
};

export type SearchFilters = {
  category: SearchCategory;
  sortBy?: 'relevance' | 'newest' | 'most_liked' | 'most_saved';
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  brands?: string[];
  categories?: string[];
};

export type SearchState = {
  query: string;
  isSearching: boolean;
  results: SearchResult;
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  trendingSearches: SearchSuggestion[];
  filters: SearchFilters;
  hasSearched: boolean;
  error?: string;
};

export type SearchAction = 
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_RESULTS'; payload: SearchResult }
  | { type: 'SET_SUGGESTIONS'; payload: SearchSuggestion[] }
  | { type: 'ADD_RECENT_SEARCH'; payload: string }
  | { type: 'CLEAR_RECENT_SEARCHES' }
  | { type: 'SET_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_SEARCH' };
