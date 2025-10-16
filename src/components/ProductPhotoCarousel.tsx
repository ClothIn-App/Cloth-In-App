/**
 * ProductPhotoCarousel Component
 * Swipeable photo carousel with dot indicators for product images
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { ProductImage } from '../types/search';

type Props = {
  images: ProductImage[];
  style?: any;
};

const { width: screenWidth } = Dimensions.get('window');

export default function ProductPhotoCarousel({ images, style }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    try {
      const slideSize = screenWidth;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentIndex(index);
    } catch (error) {
      console.warn('Error handling scroll:', error);
    }
  };

  const scrollToIndex = (index: number) => {
    try {
      if (scrollViewRef.current && index >= 0 && index < images.length) {
        scrollViewRef.current.scrollTo({
          x: index * screenWidth,
          animated: true,
        });
      }
    } catch (error) {
      console.warn('Error scrolling to index:', error);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((image, index) => (
          <View key={image.id} style={styles.imageContainer}>
            <Image
              source={{ uri: image.url }}
              style={styles.image}
              resizeMode="cover"
              accessibilityLabel={image.alt || `Product image ${index + 1}`}
            />
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
              onPress={() => scrollToIndex(index)}
              accessibilityLabel={`Go to image ${index + 1}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth * 1.2, // 5:6 aspect ratio
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
