// src/create/post/components/ProductGrid.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import type { ProductLite } from './types';

export type ProductGridProps = {
  products: ProductLite[];
  /** Called when the × in a cell is pressed */
  onRemove?: (id: string) => void;
};

export default function ProductGrid({ products, onRemove }: ProductGridProps) {
  // Placeholder implementation - functionality will be added later
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderText}>Product selection coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});