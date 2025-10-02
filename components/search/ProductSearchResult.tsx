import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { ProductSearchResult as ProductSearchResultType } from '@/src/types/search';

interface ProductSearchResultProps {
  product: ProductSearchResultType;
  onPress?: (product: ProductSearchResultType) => void;
  onPurchase?: (product: ProductSearchResultType) => void;
}

export default function ProductSearchResult({ product, onPress, onPurchase }: ProductSearchResultProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';

  const handlePress = () => {
    onPress?.(product);
  };

  const handlePurchase = () => {
    onPurchase?.(product);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push('☆');
    }

    return stars.join('');
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: borderColor }]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          {!product.isAvailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <View style={styles.header}>
            <Text style={[styles.productName, { color: textColor }]} numberOfLines={2}>
              {product.name}
            </Text>
            {product.brand && (
              <Text style={[styles.brand, { color: mutedTextColor }]}>
                {product.brand}
              </Text>
            )}
          </View>

          {product.category && (
            <Text style={[styles.category, { color: mutedTextColor }]}>
              {product.category}
            </Text>
          )}

          {product.rating && product.reviewCount && (
            <View style={styles.ratingContainer}>
              <Text style={[styles.rating, { color: textColor }]}>
                {renderStars(product.rating)}
              </Text>
              <Text style={[styles.reviewCount, { color: mutedTextColor }]}>
                ({product.reviewCount.toLocaleString()})
              </Text>
            </View>
          )}

          {product.price && (
            <View style={styles.priceContainer}>
              <Text style={[styles.price, { color: textColor }]}>
                {formatPrice(product.price, product.currency || 'USD')}
              </Text>
            </View>
          )}
        </View>

        {product.purchaseUrl && product.isAvailable && (
          <TouchableOpacity
            style={[styles.purchaseButton, { backgroundColor: textColor }]}
            onPress={handlePurchase}
          >
            <Text style={[styles.purchaseButtonText, { color: cardColor }]}>
              Buy
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  brand: {
    fontSize: 14,
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
  },
  priceContainer: {
    marginTop: 'auto',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  purchaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 'auto',
  },
  purchaseButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
