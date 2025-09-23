// FitPic types - comprehensive data models for fit pic posts
// These types are designed to match what the API will need (1:1 mapping)

export type ProductLite = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  purchaseUrl?: string;
};


export type FitPicPhoto = {
  id: string;
  url: string;
  thumbnailUrl?: string;
  index: number; // 0-based order
  isCover: boolean; // first photo is cover
  width?: number;
  height?: number;
  alt?: string;
};

export type EmojiReaction = {
  emoji: string;
  count: number;
  users: string[]; // user IDs who reacted with this emoji
};

export type FitPicEngagement = {
  likes: number;
  saves: number;
  comments: number;
  shares?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  reactions?: EmojiReaction[];
  userReactions?: string[]; // emojis the current user has reacted with
};

export type FitPic = {
  id: string;
  authorId: string;
  author: {
    uid: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  
  // Content
  photos: FitPicPhoto[]; // ordered array, first is cover
  caption: string;
  products: ProductLite[];
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  
  // Engagement
  engagement: FitPicEngagement;
  
  // Optional fields
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isPublic: boolean;
  
  // Moderation
  isReported?: boolean;
  isHidden?: boolean;
};

// Request/Response types for API calls
export type CreateFitPicRequest = {
  photos: {
    uri: string;
    type: string;
    name: string;
  }[];
  caption: string;
  products: ProductLite[];
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  isPublic?: boolean;
};

export type CreateFitPicResponse = {
  success: boolean;
  fitpic?: FitPic;
  error?: string;
  uploadErrors?: {
    photoIndex: number;
    error: string;
  }[];
};

export type GetFitPicResponse = {
  success: boolean;
  fitpic?: FitPic;
  error?: string;
};

export type GetFitPicsResponse = {
  success: boolean;
  fitpics: FitPic[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
  error?: string;
};

export type UpdateFitPicEngagementRequest = {
  fitpicId: string;
  action: 'like' | 'unlike' | 'save' | 'unsave';
};

export type UpdateFitPicEngagementResponse = {
  success: boolean;
  engagement?: FitPicEngagement;
  error?: string;
};

// Filter and search types
export type FitPicFilters = {
  userId?: string;
  hasProducts?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  engagement?: {
    minLikes?: number;
    minSaves?: number;
  };
};

export type FitPicSortOptions = 'newest' | 'oldest' | 'most_liked' | 'most_saved' | 'trending';

// Feed types
export type FeedType = 'forYou' | 'following' | 'trending';

export type GetFeedRequest = {
  type: FeedType;
  cursor?: string;
  limit?: number;
  filters?: FitPicFilters;
  sort?: FitPicSortOptions;
};

export type GetFeedResponse = {
  success: boolean;
  fitpics: FitPic[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
  error?: string;
};
