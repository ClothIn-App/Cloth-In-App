/**
 * ProductPriceDisplay Component
 * Displays product price with visual indicators based on price status
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ProductPriceStatus } from '../types/search';

type Props = {
  price?: number | null;
  originalPrice?: number;
  currency?: string;
  priceStatus?: ProductPriceStatus;
  style?: any;
};

export default function ProductPriceDisplay({
  price,
  originalPrice,
  currency = 'USD',
  priceStatus = 'Fixed',
  style,
}: Props) {
  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const renderPriceContent = () => {
    switch (priceStatus) {
      case 'Sale':
        return (
          <View style={styles.priceContainer}>
            <Text style={styles.salePrice}>
              {price ? formatPrice(price, currency) : ''}
            </Text>
            {originalPrice && (
              <Text style={styles.originalPrice}>
                {formatPrice(originalPrice, currency)}
              </Text>
            )}
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>SALE</Text>
            </View>
          </View>
        );

      case 'Sold Out':
        return (
          <View style={styles.priceContainer}>
            <Text style={styles.soldOutPrice}>
              {price ? formatPrice(price, currency) : ''}
            </Text>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutBadgeText}>SOLD OUT</Text>
            </View>
          </View>
        );

      case 'TBD':
        return (
          <View style={styles.priceContainer}>
            <Text style={styles.tbdPrice}>Price TBD</Text>
            <View style={styles.tbdBadge}>
              <Text style={styles.tbdBadgeText}>COMING SOON</Text>
            </View>
          </View>
        );

      case 'N/A':
        // Hide price completely for N/A status
        return null;

      case 'Fixed':
      default:
        return (
          <View style={styles.priceContainer}>
            <Text style={styles.regularPrice}>
              {price ? formatPrice(price, currency) : ''}
            </Text>
          </View>
        );
    }
  };

  return <View style={[styles.container, style]}>{renderPriceContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  regularPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
  },
  salePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#DC2626', // Red for sale price
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  soldOutPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  tbdPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  saleBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  saleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  soldOutBadge: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  soldOutBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tbdBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  tbdBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
