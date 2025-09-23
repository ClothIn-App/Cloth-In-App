/**
 * FitPicCard Component
 * Displays a single FitPic in Pinterest-style grid layout
 * Shows only the cover photo with minimal overlays
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FitPic } from '../types/fitpic';

type Props = {
  fitpic: FitPic;
  onPress: (fitpic: FitPic) => void;
  style?: any;
};

const { width: screenWidth } = Dimensions.get('window');
const getCardWidth = () => {
  const numColumns = screenWidth >= 768 ? 3 : 2;
  const horizontalPadding = 24; // 12px padding on each side from FitPicGrid
  const cardMargins = 8; // 4px margin on each side of each card
  const totalMarginSpace = cardMargins * numColumns;
  return (screenWidth - horizontalPadding - totalMarginSpace) / numColumns;
};

export default function FitPicCard({ fitpic, onPress, style }: Props) {
  const coverPhoto = fitpic.photos.find(photo => photo.isCover) || fitpic.photos[0];
  const hasMultiplePhotos = fitpic.photos.length > 1;

  const handlePress = () => {
    onPress(fitpic);
  };

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {/* Cover Photo */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: coverPhoto?.url }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Multiple photos indicator */}
        {hasMultiplePhotos && (
          <View style={styles.multiplePhotosIndicator}>
            <Ionicons name="images" size={16} color="#ffffff" />
            <Text style={styles.multiplePhotosText}>{fitpic.photos.length}</Text>
          </View>
        )}

        {/* Products indicator - only show if there are products */}
        {fitpic.products.length > 0 && (
          <View style={styles.productsIndicator}>
            <Ionicons name="shirt" size={12} color="#ffffff" />
            <Text style={styles.productsText}>{fitpic.products.length}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: getCardWidth(),
    height: getCardWidth() * 1.3, // Slightly taller for Pinterest feel
  },
  image: {
    width: '100%',
    height: '100%',
  },
  multiplePhotosIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  multiplePhotosText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  productsIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  productsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
