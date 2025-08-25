// app/types/media.ts

/** 'photo' or 'video' */
export type MediaKind = 'photo' | 'video';

/**
 * Canonical media item shape used across the create flow.
 */
export type MediaItem = {
  id: string;
  uri: string;
  type: MediaKind;
  width?: number;
  height?: number;
  /** Video length in milliseconds (omit for photos) */
  durationMs?: number;
  /** Unix epoch ms (e.g., Date.now()) */
  createdAt: number;
};