import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { buildProductFeed } from '../../src/utils/normalizeFeed';
import type { ProductItem } from '../../src/types/feed';
import { contentApiClient } from '../../src/services/apiClients/contentClient';
import FeaturedProductCard from './featured-product-card';

const MAX_ITEMS = 6;

/** Map getProduct response to ProductLike shape (imageUrl from primaryImageUrl or images for real API). */
function toProductLike(p: {
  id: string;
  name: string;
  brand?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  priceType?: string;
  description?: string | null;
  createdAt?: string;
  primaryImageUrl?: string | null;
  images?: Array<{ url?: string }> | string[];
  imagePath?: string;
  imageUrl?: string | null;
}): { id: string; name: string; brand?: string; price?: number | null; originalPrice?: number; priceType?: string; description?: string; imageUrl: string; createdAt: string } {
  const firstImageUrl = Array.isArray(p.images) && p.images[0]
    ? typeof p.images[0] === 'object'
      ? (p.images[0] as { url?: string }).url
      : p.images[0]
    : undefined;
  const imageUrl = p.primaryImageUrl ?? firstImageUrl ?? p.imagePath ?? p.imageUrl ?? '';
  return {
    id: p.id,
    name: p.name,
    brand: p.brand ?? undefined,
    price: p.price ?? undefined,
    originalPrice: p.originalPrice ?? undefined,
    priceType: p.priceType,
    description: p.description ?? undefined,
    imageUrl,
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}

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

  // Load products by ID using getProduct (preserves order; ignores failed lookups)
  useEffect(() => {
    if (!featuredProductIds || featuredProductIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      const idsToFetch = featuredProductIds.slice(0, MAX_ITEMS);
      const results = await Promise.allSettled(
        idsToFetch.map((id) => contentApiClient.getProduct(id))
      );

      const productLikes = results
        .map((result) => {
          if (result.status !== 'fulfilled' || !result.value?.product) return null;
          const p = result.value.product as Parameters<typeof toProductLike>[0];
          const like = toProductLike(p);
          if (!like.imageUrl) return null;
          return like;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      try {
        const normalized = await buildProductFeed(productLikes);
        setProducts(normalized);
      } catch (error) {
        console.warn('Error normalizing featured products:', error);
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

  // Grid: 2 rows × 3 columns max (already limited by MAX_ITEMS in load)
  const displayProducts = products.slice(0, MAX_ITEMS);
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

