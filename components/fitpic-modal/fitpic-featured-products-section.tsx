import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { buildProductFeed } from '../../src/utils/normalizeFeed';
import type { ProductItem } from '../../src/types/feed';
import FeaturedProductCard from './featured-product-card';

type Props = {
  featuredProductIds?: string[];
  onOpenProduct: (productId: string) => void;
};

export default function FitPicFeaturedProductsSection({
  featuredProductIds,
  onOpenProduct,
}: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products by their IDs
  useEffect(() => {
    if (!featuredProductIds || featuredProductIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        // Load all products first to build the cache
        const allProducts = await buildProductFeed();
        // Create a map for quick lookup
        const productMap = new Map<string, ProductItem>();
        allProducts.forEach(product => {
          productMap.set(product.id, product);
        });
        
        // Look up products by IDs
        const validProducts = featuredProductIds
          .map(id => productMap.get(id))
          .filter((product): product is ProductItem => product !== undefined);
        
        setProducts(validProducts);
      } catch (error) {
        console.warn('Error loading featured products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [featuredProductIds]);

  // If no products or still loading, render nothing
  if (loading || products.length === 0) {
    return null;
  }

  // Calculate grid layout: 2 rows, 3 columns max
  const maxItems = 6; // 2 rows × 3 columns
  const displayProducts = products.slice(0, maxItems);
  const rows: ProductItem[][] = [];
  
  // Group products into rows of 3
  for (let i = 0; i < displayProducts.length; i += 3) {
    rows.push(displayProducts.slice(i, i + 3));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Featured products</Text>
      
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((product) => (
              <View key={product.id} style={styles.cardWrapper}>
                <FeaturedProductCard
                  productId={product.id}
                  imageSource={product.source}
                  brand={product.brand}
                  name={product.name}
                  price={product.price}
                  salePrice={product.salePrice}
                  onPress={onOpenProduct}
                />
              </View>
            ))}
            {/* Fill remaining space if row has less than 3 items */}
            {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={styles.cardWrapper} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cardWrapper: {
    flex: 1,
    minWidth: 0, // Allows flex items to shrink below their content size
  },
});

