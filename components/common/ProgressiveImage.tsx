import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, ImageStyle, ImageSourcePropType } from 'react-native';
import { Image, ImageSource, ImageContentFit } from 'expo-image';

type ProgressiveImageProps = {
  source: ImageSourcePropType | string | { uri: string } | ImageSource;
  style?: ImageStyle | ImageStyle[];
  contentFit?: ImageContentFit;
  placeholder?: ImageSource;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
};

export default function ProgressiveImage({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  onLoadStart,
  onLoadEnd,
}: ProgressiveImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setLoading(false);
    onLoadEnd?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // Convert ImageSourcePropType to expo-image format
  const imageSource: ImageSource = typeof source === 'string' 
    ? { uri: source }
    : typeof source === 'object' && 'uri' in source
    ? { uri: source.uri }
    : (source as ImageSource);

  const borderRadius = style && typeof style === 'object' && !Array.isArray(style) && 'borderRadius' in style
    ? style.borderRadius
    : 0;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        transition={300}
        placeholder={placeholder}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        cachePolicy="memory-disk"
      />
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer, { borderRadius }]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
      {error && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer, { borderRadius }]}>
          {/* Optional: Add error icon */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});
