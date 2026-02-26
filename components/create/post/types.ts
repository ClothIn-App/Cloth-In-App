// Minimal post metadata & upload types

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

export type PostMeta = {
  caption: string;
  products: ProductLite[];
  location?: string;
};

export type UploadedPhoto = {
  id: string;
  url: string;
  index: number;
  isCover: boolean;
};

export type CreatedPost = {
  id: string;
  photos: UploadedPhoto[]; // ordered; index 0 is cover
  products: ProductLite[];
  caption: string;
};

export const CAPTION_MAX = 2200;
