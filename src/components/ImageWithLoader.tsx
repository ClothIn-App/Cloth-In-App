/**
 * ImageWithLoader Component
 * Displays an image with a loading skeleton animation
 * Shows a shimmer effect while loading and fades in when ready
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

type Props = {
  source: { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  showSkeleton?: boolean;
  skeletonColor?: string;
  shimmerColor?: string;
};

const { width: screenWidth } = Dimensions.get('window');

export default function ImageWithLoader({
  source,
  style,
  resizeMode = 'cover',
  showSkeleton = true,
  skeletonColor = '#f3f4f6',
  shimmerColor = '#e5e7eb',
}: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));

  // Shimmer animation
  useEffect(() => {
    if (isLoading) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();

      return () => shimmerAnimation.stop();
    }
  }, [isLoading, shimmerAnim]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Still fade in, but show error state
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Main Image */}
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={source}
          style={[styles.image, style]}
          resizeMode={resizeMode}
          onLoad={handleLoad}
          onError={handleError}
        />
      </Animated.View>

      {/* Loading Skeleton */}
      {isLoading && showSkeleton && (
        <View style={[styles.skeletonContainer, style]}>
          <View style={[styles.skeleton, { backgroundColor: skeletonColor }]}>
            <Animated.View
              style={[
                styles.shimmer,
                {
                  backgroundColor: shimmerColor,
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Error State */}
      {hasError && (
        <View style={[styles.errorContainer, style]}>
          <View style={[styles.errorPlaceholder, { backgroundColor: skeletonColor }]}>
            <View style={styles.errorIcon}>
              <View style={styles.errorIconInner} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeletonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  skeleton: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#9ca3af',
  },
});
