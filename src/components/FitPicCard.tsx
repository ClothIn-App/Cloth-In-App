/**
 * FitPicCard Component
 * Displays a single FitPic in grid layout
 * Shows cover photo, engagement metrics, and basic info
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
const cardWidth = (screenWidth - 48) / 2; // 2 columns with padding

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

        {/* Engagement overlay */}
        <View style={styles.engagementOverlay}>
          <View style={styles.engagementItem}>
            <Ionicons name="heart" size={14} color="#ffffff" />
            <Text style={styles.engagementText}>{fitpic.engagement.likes}</Text>
          </View>
          <View style={styles.engagementItem}>
            <Ionicons name="bookmark" size={14} color="#ffffff" />
            <Text style={styles.engagementText}>{fitpic.engagement.saves}</Text>
          </View>
        </View>
      </View>

      {/* Caption preview */}
      {fitpic.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption} numberOfLines={2}>
            {fitpic.caption}
          </Text>
        </View>
      )}

      {/* Products indicator */}
      {fitpic.products.length > 0 && (
        <View style={styles.productsIndicator}>
          <Ionicons name="shirt" size={12} color="#6b7280" />
          <Text style={styles.productsText}>{fitpic.products.length} items</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: cardWidth,
    height: cardWidth * 1.2, // 5:6 aspect ratio
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  multiplePhotosText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  engagementOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  engagementText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  captionContainer: {
    padding: 12,
    paddingBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  productsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
  },
  productsText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
