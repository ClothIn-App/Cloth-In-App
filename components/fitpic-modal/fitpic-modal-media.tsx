import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { Image } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  /** Single image (legacy): string URI, { uri }, or require() */
  imageUrl?: string | { uri: string } | number;
  /** Ordered photo URLs for carousel; when length >= 2, carousel is shown */
  imageUrls?: string[];
  aspectRatio?: number;
  onToggleChrome?: () => void;
  borderRadius?: number;
};

export default function FitPicModalMedia({
  imageUrl,
  imageUrls,
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<number, boolean>>({});

  const opacity = useSharedValue(0);

  // Carousel only when imageUrls has 2+ string URIs; otherwise single image from imageUrls[0] or imageUrl
  const urls = imageUrls?.length ? imageUrls : [];
  const isCarousel = urls.length >= 2;
  const singleImageUrl = urls.length === 1 ? urls[0] : imageUrl;

  const imageSource = React.useMemo(() => {
    if (!singleImageUrl) return { uri: '' };
    if (typeof singleImageUrl === 'string') return { uri: singleImageUrl };
    if (typeof singleImageUrl === 'object' && singleImageUrl !== null && 'uri' in singleImageUrl) {
      return { uri: String((singleImageUrl as { uri: string }).uri) };
    }
    if (typeof singleImageUrl === 'number') return singleImageUrl;
    return { uri: '' };
  }, [singleImageUrl]);

  useEffect(() => {
    if (providedAspectRatio || isCarousel) return;
    const current = singleImageUrl;
    if (!current) return;

    const getImageDimensions = () => {
      try {
        if (typeof current === 'number') {
          try {
            const resolved = Image.resolveAssetSource(current);
            if (resolved?.width && resolved?.height) {
              setCalculatedAspectRatio(resolved.height / resolved.width);
              return;
            }
          } catch (e) {}
        }
        if (typeof current === 'string') {
          Image.getSize(
            current,
            (width, height) => {
              if (width > 0 && height > 0) setCalculatedAspectRatio(height / width);
              else setCalculatedAspectRatio(1);
            },
            () => setCalculatedAspectRatio(1)
          );
          return;
        }
        if (current && typeof current === 'object' && 'uri' in current && typeof (current as { uri: string }).uri === 'string') {
          Image.getSize(
            (current as { uri: string }).uri,
            (width, height) => {
              if (width > 0 && height > 0) setCalculatedAspectRatio(height / width);
              else setCalculatedAspectRatio(1);
            },
            () => setCalculatedAspectRatio(1)
          );
          return;
        }
        setCalculatedAspectRatio(1);
      } catch (err) {
        setCalculatedAspectRatio(1);
      }
    };
    getImageDimensions();
  }, [singleImageUrl, providedAspectRatio, isCarousel]);

  const aspectRatio = providedAspectRatio ?? calculatedAspectRatio ?? 1;
  const containerHeight = SCREEN_WIDTH * aspectRatio;

  const imageOpacityStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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

  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCarouselIndex(Math.round(offsetX / SCREEN_WIDTH));
  };

  // Empty state: no imageUrl and no imageUrls (or empty)
  if (singleImageUrl == null && urls.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { height: SCREEN_WIDTH, borderRadius, backgroundColor: '#1a1a1a' },
        ]}
      >
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderContent} />
        </View>
      </View>
    );
  }

  // Carousel: 2+ images, fixed height from cover aspect ratio, contentFit cover, pill indicator
  if (isCarousel) {
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
        <ScrollView
          horizontal
          pagingEnabled
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          {urls.map((uri, index) => {
            const source = uri ? { uri } : undefined;
            const isLoading = loadingStates[index];
            const hasError = errorStates[index];
            return (
              <View
                key={index}
                style={[
                  styles.carouselPage,
                  { width: SCREEN_WIDTH, height: containerHeight },
                ]}
              >
                {source && !hasError && (
                  <ExpoImage
                    source={source}
                    style={[StyleSheet.absoluteFill, { borderRadius }]}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                    onLoadStart={() => setLoadingStates((s) => ({ ...s, [index]: true }))}
                    onLoad={() => setLoadingStates((s) => ({ ...s, [index]: false }))}
                    onError={() => {
                      setLoadingStates((s) => ({ ...s, [index]: false }));
                      setErrorStates((s) => ({ ...s, [index]: true }));
                    }}
                  />
                )}
                {isLoading && (
                  <View style={[StyleSheet.absoluteFill, styles.loadingContainer, { borderRadius }]}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
                {hasError && (
                  <View style={[StyleSheet.absoluteFill, styles.errorPlaceholder, { borderRadius }]}>
                    <Text style={styles.errorText}>Image unavailable</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>
            {carouselIndex + 1} / {urls.length}
          </Text>
        </View>
      </View>
    );
  }

  // Single image: existing behavior (contain, fade-in, loading/error)
  if (error) {
    return (
      <View
        style={[
          styles.container,
          { height: containerHeight, borderRadius, backgroundColor: '#1a1a1a' },
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
        { height: containerHeight, borderRadius, backgroundColor: '#1a1a1a' },
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
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer, { borderRadius }]}>
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
  scrollView: {
    width: '100%',
  },
  carouselPage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
  errorPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    fontSize: 14,
    color: '#999',
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

