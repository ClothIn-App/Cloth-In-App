// src/create/product/brandselect.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAddProductContext } from './addproductcontext';

export default function BrandSelect() {
  const { brand, setBrand } = useAddProductContext();

  const handleBrandChange = (text: string) => {
    // Limit to 50 characters
    if (text.length <= 50) {
      setBrand(text);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Brand *</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={handleBrandChange}
        placeholder="Enter Brand Name"
        placeholderTextColor="#9ca3af"
        maxLength={50}
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Text style={styles.characterCount}>{brand.length}/50</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
});
