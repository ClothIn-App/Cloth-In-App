// app/src/create/cameraroll/types.ts
export type AssetLite = {
  id: string;
  uri: string;
  width: number;
  height: number;
  /** Unix ms timestamp (optional) */
  creationTime?: number;
};

/** Number of columns in the camera roll grid */
export const COLS = 4;

/**
 * Compute square tile size for the grid given the screen width.
 * Rounded down to avoid fractional pixels and layout jitter.
 */
export function getTileSize(screenWidth: number): number {
  return Math.floor(screenWidth / COLS);
}
