import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ProductSearchResult } from '../../src/types/search';
import { recordSearchEvent } from '../../src/services/apiClients/analyticsClient';

type Props = {
  products: ProductSearchResult[];
  onSeeAll: () => void;
};

export default function ProductsPreview({ products, onSeeAll }: Props) {
  const previewProducts = products.slice(0, 5);

  const formatPrice = (price: number | null | undefined, currency = 'USD') => {
    if (price === null || price === undefined) return 'Price TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Products</Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>
            {products.length > previewProducts.length ? 'See all' : 'Expand'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#666A70" />
        </TouchableOpacity>
      </View>

      {previewProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {previewProducts.map((product) => {
            const handlePress = () => {
              recordSearchEvent(product.name || product.id, "search_result_click", {
                resultType: "product",
                resultId: product.id,
              });
              router.push({
                pathname: '/product-detail',
                params: { id: product.id, source: 'search' },
              });
            };

            return (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productItem}
                onPress={handlePress}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: product.imageUrl || 'https://placehold.co/80x80' }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.brand && (
                    <Text style={styles.brand}>{product.brand}</Text>
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
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#666A70',
    fontWeight: '500',
  },
  list: {
    gap: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  productImage: {
    width: 80,
    height: 80,
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
  },
  brand: {
    fontSize: 14,
    color: '#666A70',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
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
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666A70',
  },
});

