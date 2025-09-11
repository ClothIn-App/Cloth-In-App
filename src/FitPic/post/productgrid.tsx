// src/FitPic/post/components/ProductGrid.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { ImageURISource } from 'react-native';
import type { ProductLite } from './types';

export type ProductGridProps = {
  products: ProductLite[];
  /** Called when the × in a cell is pressed */
  onRemove?: (id: string) => void;
};

const MAX_COLUMNS = 4;
const MAX_ITEMS = 8;
const GUTTER = 8; // spacing between cells

// TS helper: narrow to items that definitely have a string uri
function hasUri(p: ProductLite): p is ProductLite & { uri: string } {
  // allow undefined/null on the original type
  return typeof (p as any).uri === 'string' && (p as any).uri.length > 0;
}

export default function ProductGrid({ products, onRemove }: ProductGridProps) {
  const { width } = useWindowDimensions();

  const CELL = useMemo(() => {
    const totalGutters = (MAX_COLUMNS + 1) * GUTTER;
    return Math.floor((width - totalGutters) / MAX_COLUMNS);
  }, [width]);

  return (
    <FlatList
      data={products.slice(0, MAX_ITEMS)}
      keyExtractor={(item) => item.id}
      numColumns={MAX_COLUMNS}
      contentContainerStyle={[styles.grid, { paddingHorizontal: GUTTER }]}
      renderItem={({ item }) => {
        const showImage = hasUri(item);
        const src: ImageURISource | undefined = showImage ? { uri: item.uri } : undefined;

        return (
          <View style={[styles.cell, { width: CELL, height: CELL, margin: GUTTER }]}>
            {showImage && src ? (
              <Image source={src} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  {(item.name ?? '').trim().slice(0, 1).toUpperCase() || '∙'}
                </Text>
              </View>
            )}

            {onRemove && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(item.id)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                activeOpacity={0.75}
              >
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  cell: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 24, fontWeight: '700' },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});