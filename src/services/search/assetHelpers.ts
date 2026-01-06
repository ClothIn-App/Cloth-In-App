/**
 * Asset helper utilities
 * Converts local asset sources to URIs for use in Image components
 */

import { Image } from 'react-native';

/**
 * Convert ImageSourcePropType (require() result) to URI string for use in Image components
 */
export function getImageUri(source: any): string | undefined {
  try {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri;
  } catch (error) {
    console.warn('Failed to resolve image URI:', error);
    return undefined;
  }
}

