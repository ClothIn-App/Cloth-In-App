// src/create/post/components/ProductGrid.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import ProgressiveImage from '../../common/ProgressiveImage';
import { Ionicons } from '@expo/vector-icons';
import type { ProductLite } from './types';

const TILE_SIZE = 92;

export type ProductGridProps = {
  products: ProductLite[];
  /** Called when the × on a tile is pressed */
  onRemove?: (id: string) => void;
};

export default function ProductGrid({ products, onRemove }: ProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <FlatList
      horizontal
      data={products}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.tileWrapper}>
          <View style={styles.tile}>
            {item.imageUrl ? (
              <ProgressiveImage
                source={{ uri: item.imageUrl }}
                style={styles.tileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.tilePlaceholder}>
                <Ionicons name="shirt-outline" size={28} color="#9ca3af" />
              </View>
            )}
            {onRemove && (
              <TouchableOpacity
                onPress={() => onRemove(item.id)}
                style={styles.removeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View style={styles.removeBadge}>
                  <Text style={styles.removeText}>×</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    paddingRight: 4,
    gap: 0,
  },
  tileWrapper: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginRight: 10,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tilePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  removeBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
});
