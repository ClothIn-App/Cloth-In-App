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
  dislikes: number;
  heart: number;
  fire: number;
  saves?: number;
  comments?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  reactions?: EmojiReaction[];
  userReactions?: string[]; // emojis the current user has reacted with
  /** Current user's reaction when auth present: LIKE | THUMBS_UP | FIRE | DISLIKE */
  userReaction?: string;
};

export type FitPicComment = {
  id: string;
  user: string; // user id or username
  text: string;
  createdAt: string;
  like: number;
  dislike: number;
  replies: FitPicComment[];
  /** Current user's reaction when auth present: like | dislike */
  userReaction?: string;
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

  // Comments (mock shape: id, user, text, createdAt, like, dislike, replies)
  comments: FitPicComment[];

  // Optional fields
  location?: string;

  // Moderation
  isReported?: boolean;
  isHidden?: boolean;
};

// Request/Response types for API calls
export type CreateFitPicRequest = {
  photos: { url: string; width?: number; height?: number }[];
  caption: string;
  products: ProductLite[];
  location?: string;
  fitpicId?: string;
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

export type ReactionType = 'LIKE' | 'THUMBS_UP' | 'FIRE' | 'DISLIKE';

export type UpdateFitPicEngagementRequest = {
  fitpicId: string;
  action: 'react' | 'unreact' | 'save' | 'unsave';
  reaction?: ReactionType; // required when action is react or unreact
};

export type UpdateFitPicEngagementResponse = {
  success: boolean;
  engagement?: FitPicEngagement;
  error?: string;
};

export type AddCommentRequest = {
  text: string;
  parentCommentId?: string;
};

export type AddCommentResponse = {
  success: boolean;
  comment?: FitPicComment;
  error?: string;
};

export type CommentReactRequest = {
  commentId: string;
  reaction: 'like' | 'dislike';
};

export type CommentReactResponse = {
  success: boolean;
  comment?: FitPicComment;
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
