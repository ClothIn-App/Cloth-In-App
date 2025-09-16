// app/types/media.ts

/** 'photo' or 'video' */
export type MediaKind = 'photo'
/**
 * Canonical media item shape used across the create flow.
 */
export type MediaItem = {
  id: string;
  uri: string;
  type: MediaKind;
  width?: number;
  height?: number;
  /** Unix epoch ms (e.g., Date.now()) */
  createdAt: number;
};