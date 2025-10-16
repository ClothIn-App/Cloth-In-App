/**
 * FitPicCard Component
 * Displays a single FitPic in Pinterest-style grid layout
 * Shows fitpic image with product indicator and username/days below
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithLoader from './ImageWithLoader';
import type { FitPic } from '../types/fitpic';

type Props = {
  fitpic: FitPic;
  onPress: (fitpic: FitPic) => void;
  style?: any;
  width?: number;
};

const { width: screenWidth } = Dimensions.get('window');

export default function FitPicCard({ fitpic, onPress, style, width }: Props) {
  const coverPhoto = fitpic.photos.find(photo => photo.isCover) || fitpic.photos[0];

  const handlePress = () => {
    onPress(fitpic);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  return (
    <Pressable
      style={[styles.container, { width }, style]}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {/* Cover Photo */}
      <View style={styles.imageContainer}>
        <ImageWithLoader
          source={{ uri: coverPhoto?.url }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Products indicator - bottom left of image */}
        {fitpic.products.length > 0 && (
          <View style={styles.productsIndicator}>
            <Ionicons name="shirt" size={12} color="#ffffff" />
            <Text style={styles.productsText}>{fitpic.products.length}</Text>
          </View>
        )}
      </View>

      {/* Info section below the image */}
      <View style={styles.infoContainer}>
        <Text 
          style={styles.usernameText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          @{fitpic.author.username}
        </Text>
        <Text 
          style={styles.dateText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formatDate(fitpic.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  productsIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
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
  infoContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  usernameText: {
    color: '#11181C',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
});
