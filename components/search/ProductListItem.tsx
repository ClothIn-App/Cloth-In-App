/**
 * ProductListItem component
 * Individual product item for search results lists
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ProductSearchResult } from '../../src/types/search';

type Props = {
  product: ProductSearchResult;
};

export default function ProductListItem({ product }: Props) {
  const formatPrice = (price: number | null | undefined, currency = 'USD') => {
    if (price === null || price === undefined) return 'Price TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const handlePress = () => {
    router.push({
      pathname: '/product-detail',
      params: { id: product.id, source: 'search' },
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: product.imageUrl || 'https://placehold.co/100x100' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(product.price, product.currency)}
          </Text>
          {product.originalPrice && product.price && product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>
              {formatPrice(product.originalPrice, product.currency)}
            </Text>
          )}
          {product.priceStatus === 'Sale' && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>Sale</Text>
            </View>
          )}
        </View>
        {product.rating !== null && product.rating !== undefined && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={styles.rating}>
              {product.rating.toFixed(1)}
            </Text>
            {product.reviewCount && (
              <Text style={styles.reviewCount}>
                ({product.reviewCount})
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#11181C',
    marginBottom: 4,
    lineHeight: 20,
  },
  brand: {
    fontSize: 14,
    color: '#666A70',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  originalPrice: {
    fontSize: 14,
    color: '#666A70',
    textDecorationLine: 'line-through',
  },
  saleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  saleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#11181C',
    fontWeight: '500',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666A70',
  },
});

