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
 * No margins on left/right, with minimal spacing between items.
 */
export function getTileSize(screenWidth: number): number {
  const MIN_PADDING = 0; // No padding on sides
  const GAP = 1; // 1px minimal gap between items
  const availableWidth = screenWidth - (MIN_PADDING * 2);
  const totalGaps = (COLS - 1) * GAP;
  return Math.floor((availableWidth - totalGaps) / COLS);
}
