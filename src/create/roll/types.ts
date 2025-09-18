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
 * Centers the grid with minimal padding on each side.
 */
export function getTileSize(screenWidth: number): number {
  const MIN_PADDING = 4; // 4px minimum padding on each side
  const GAP = 0; // 3px gap between items (slightly more space)
  const availableWidth = screenWidth - (MIN_PADDING * 2);
  const totalGaps = (COLS - 1) * GAP;
  return Math.floor((availableWidth - totalGaps) / COLS);
}
