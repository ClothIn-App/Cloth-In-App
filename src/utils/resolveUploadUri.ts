/**
 * Resolve a photo URI to a local file path suitable for upload.
 * Camera roll assets use ph:// (iOS) or content:// (Android) URIs that FormData
 * cannot read; this resolves them via MediaLibrary.getAssetInfoAsync.
 */

import * as MediaLibrary from 'expo-media-library';

/**
 * Returns a URI that can be read for upload (file:// or resolved local path).
 * - If rawUri is already a file path (not ph:// or content://), returns it.
 * - Otherwise resolves via MediaLibrary.getAssetInfoAsync(id) and returns
 *   localUri ?? uri ?? null. Returns null on failure.
 */
export async function resolveUploadUri(
  id: string,
  rawUri: string | null | undefined
): Promise<string | null> {
  if (rawUri && !rawUri.startsWith('ph://') && !rawUri.startsWith('content://')) {
    return rawUri;
  }
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id);
    return info.localUri ?? info.uri ?? null;
  } catch {
    return null;
  }
}
