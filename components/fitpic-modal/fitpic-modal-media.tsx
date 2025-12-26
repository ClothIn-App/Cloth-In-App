import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Image as ExpoImage, ImageSource } from 'expo-image';
import { Image } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  imageUrl: string | any; // ImageSourcePropType or string URI
  aspectRatio?: number;
  onToggleChrome?: () => void;
  borderRadius?: number;
};

export default function FitPicModalMedia({
  imageUrl,
  aspectRatio: providedAspectRatio,
  onToggleChrome,
  borderRadius = 0,
}: Props) {
  const [calculatedAspectRatio, setCalculatedAspectRatio] = useState<number | null>(
    providedAspectRatio || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fade-in animation
  const opacity = useSharedValue(0);

  // Normalize image source for expo-image - memoize to avoid recreating on each render
  const imageSource = React.useMemo(() => {
    if (!imageUrl) {
      return { uri: '' };
    }
    if (typeof imageUrl === 'string') {
      return { uri: imageUrl };
    }
    if (typeof imageUrl === 'object' && imageUrl !== null && 'uri' in imageUrl) {
      return { uri: String(imageUrl.uri) };
    }
    if (typeof imageUrl === 'number') {
      // For require() assets, pass as-is - expo-image handles this
      return imageUrl;
    }
    // Fallback - should not happen, but handle gracefully
    return { uri: '' };
  }, [imageUrl]);

  // Early return if no valid image source
  if (!imageUrl) {
    return (
      <View
        style={[
          styles.container,
          {
            height: SCREEN_WIDTH,
            borderRadius,
            backgroundColor: '#1a1a1a',
          },
        ]}
      >
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderContent} />
        </View>
      </View>
    );
  }

  // Calculate aspect ratio from image if not provided
  useEffect(() => {
    if (providedAspectRatio) {
      return;
    }

    const getImageDimensions = () => {
      try {
        // Handle require() assets (numbers)
        if (typeof imageUrl === 'number') {
          try {
            const resolved = Image.resolveAssetSource(imageUrl);
            if (resolved?.width && resolved?.height) {
              setCalculatedAspectRatio(resolved.height / resolved.width);
              return;
            }
          } catch (e) {
            // Fall through to default
          }
        }
        
        // Handle string URIs
        if (typeof imageUrl === 'string') {
          Image.getSize(
            imageUrl,
            (width, height) => {
              if (width > 0 && height > 0) {
                setCalculatedAspectRatio(height / width);
              } else {
                setCalculatedAspectRatio(1);
              }
            },
            () => {
              setCalculatedAspectRatio(1);
            }
          );
          return;
        }

        // Handle object with uri
        if (imageUrl && typeof imageUrl === 'object' && 'uri' in imageUrl && typeof imageUrl.uri === 'string') {
          Image.getSize(
            imageUrl.uri,
            (width, height) => {
              if (width > 0 && height > 0) {
                setCalculatedAspectRatio(height / width);
              } else {
                setCalculatedAspectRatio(1);
              }
            },
            () => {
              setCalculatedAspectRatio(1);
            }
          );
          return;
        }

        // Fallback to square
        setCalculatedAspectRatio(1);
      } catch (err) {
        setCalculatedAspectRatio(1);
      }
    };

    getImageDimensions();
  }, [imageUrl, providedAspectRatio]);

  const aspectRatio = providedAspectRatio || calculatedAspectRatio || 1;
  const containerHeight = SCREEN_WIDTH * aspectRatio;

  const imageOpacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
    opacity.value = 0;
  };

  const handleLoad = () => {
    setLoading(false);
    setImageLoaded(true);
    opacity.value = withTiming(1, { duration: 300 });
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    opacity.value = 0;
  };

  if (error) {
    // Error placeholder
    return (
      <View
        style={[
          styles.container,
          {
            height: containerHeight,
            borderRadius,
            backgroundColor: '#1a1a1a',
          },
        ]}
      >
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderContent} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height: containerHeight,
          borderRadius,
          backgroundColor: '#1a1a1a',
        },
      ]}
    >
      <Pressable
        onPress={onToggleChrome}
        style={styles.imageContainer}
        disabled={!onToggleChrome}
      >
        <Animated.View style={[StyleSheet.absoluteFill, imageOpacityStyle]}>
          <ExpoImage
            key={typeof imageSource === 'number' ? imageSource : undefined}
            source={imageSource}
            style={[StyleSheet.absoluteFill, { borderRadius }]}
            contentFit="contain"
            transition={300}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onError={handleError}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </Pressable>

      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.loadingContainer,
            { borderRadius },
          ]}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
  },
});

