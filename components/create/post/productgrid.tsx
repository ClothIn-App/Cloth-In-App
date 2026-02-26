// src/create/post/components/ProductGrid.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import type { ProductLite } from './types';

export type ProductGridProps = {
  products: ProductLite[];
  /** Called when the × in a cell is pressed */
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
      contentContainerStyle={styles.chips}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={styles.chip}>
          <Text numberOfLines={1} style={styles.chipText}>
            {item.name ?? 'Unnamed'}
            {item.brand ? ` · ${item.brand}` : ''}
          </Text>
          {onRemove && (
            <TouchableOpacity
              onPress={() => onRemove(item.id)}
              style={styles.chipX}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.chipXText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  chips: { paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 180,
  },
  chipText: { fontSize: 13, flexShrink: 1 },
  chipX: { marginLeft: 6 },
  chipXText: { fontSize: 14, fontWeight: '700' },
});
