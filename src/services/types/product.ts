import type { ReactionType } from "../../types/fitpic";

export type ProductReactionCounts = {
  LIKE: number;
  THUMBS_UP: number;
  FIRE: number;
  DISLIKE: number;
};

export type ProductComment = {
  id: string;
  user: string;
  text: string;
  createdAt: string;
  like: number;
  dislike: number;
  replies: ProductComment[];
  userReaction?: string;
};

export type UpdateProductEngagementRequest = {
  productId: string;
  action: "react" | "unreact";
  reaction?: ReactionType;
};

export type UpdateProductEngagementResponse = {
  success: boolean;
  reactions?: ProductReactionCounts;
  error?: string;
};

export type AddProductCommentRequest = {
  text: string;
  parentCommentId?: string;
};

export type AddProductCommentResponse = {
  success: boolean;
  comment?: ProductComment;
  error?: string;
};

export type ProductCommentReactRequest = {
  commentId: string;
  reaction: "like" | "dislike";
};

export type ProductCommentReactResponse = {
  success: boolean;
  comment?: ProductComment;
  error?: string;
};
