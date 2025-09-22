/**
 * ProductTag Component
 * Instagram-style product tagging on photos
 * Shows a small dot that expands to show product info when tapped
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProductTag as ProductTagType } from '../types/fitpic';

type Props = {
  tag: ProductTagType;
  onPress?: (tag: ProductTagType) => void;
  style?: any;
};

export default function ProductTag({ tag, onPress, style }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = () => {
    setIsExpanded(!isExpanded);
    onPress?.(tag);
  };

  return (
    <View style={[styles.container, { left: `${tag.x}%`, top: `${tag.y}%` }, style]}>
      {/* Tag dot */}
      <Pressable
        style={styles.tagDot}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <Ionicons name="shirt" size={12} color="#ffffff" />
      </Pressable>

      {/* Expanded product info */}
      {isExpanded && (
        <View style={styles.productInfo}>
          <View style={styles.productInfoContent}>
            <Text style={styles.productName} numberOfLines={1}>
              {tag.product.name}
            </Text>
            <Text style={styles.productBrand} numberOfLines={1}>
              {tag.product.brand}
            </Text>
            {tag.product.price && (
              <Text style={styles.productPrice}>
                ${tag.product.price.toFixed(2)}
              </Text>
            )}
          </View>
          <View style={styles.arrow} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  tagDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  productInfo: {
    position: 'absolute',
    top: 30,
    left: -50,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    maxWidth: 200,
  },
  productInfoContent: {
    alignItems: 'center',
  },
  productName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  productBrand: {
    color: '#d1d5db',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  productPrice: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0,0,0,0.9)',
  },
});
