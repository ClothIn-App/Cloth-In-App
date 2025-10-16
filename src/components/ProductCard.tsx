/**
 * ProductCard Component
 * Displays a single product in Pinterest-style grid layout
 * Shows product image with price overlay and brand/product name below
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import ImageWithLoader from './ImageWithLoader';
import type { ProductSearchResult } from '../types/search';

type Props = {
  product: ProductSearchResult;
  onPress: (product: ProductSearchResult) => void;
  style?: any;
  width?: number;
};

const { width: screenWidth } = Dimensions.get('window');

export default function ProductCard({ product, onPress, style, width }: Props) {
  const handlePress = () => {
    onPress(product);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  // Check if product has sale pricing
  const hasSalePrice = (product as any).originalPrice && product.price && (product as any).originalPrice > product.price;
  const originalPrice = hasSalePrice ? (product as any).originalPrice : null;

  return (
    <Pressable
      style={[styles.container, { width }, style]}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <ImageWithLoader
          source={{ uri: product.imageUrl || '' }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Price overlay - top left corner */}
        {product.price && (
          <View style={styles.priceOverlay}>
            <Text style={styles.priceText}>
              {formatPrice(product.price, product.currency || 'USD')}
            </Text>
          </View>
        )}
      </View>

      {/* Product Info below the image */}
      <View style={styles.infoContainer}>
        {product.brand && (
          <Text style={styles.brandText} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <Text style={styles.nameText} numberOfLines={2} ellipsizeMode="tail">
          {product.name}
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
    flex: 1,
    flexDirection: 'column',
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    flexShrink: 0,
  },
  brandText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 13,
    color: '#11181C',
    fontWeight: '600',
    lineHeight: 16,
  },
});
