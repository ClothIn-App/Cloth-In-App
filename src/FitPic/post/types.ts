// Lightweight types for post-only fields (caption/products)

export const CAPTION_MAX = 2200 as const; // enforced by setter elsewhere

export type PostMeta = {
  caption: string;
  productIds: string[]; // placeholder IDs for now
  updatedAt: number;
};