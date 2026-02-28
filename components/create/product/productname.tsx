// src/create/product/productname.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAddProductContext } from './addproductcontext';

export default function ProductName() {
  const { productName, setProductName } = useAddProductContext();

  const handleNameChange = (text: string) => {
    // Limit to 100 characters
    if (text.length <= 100) {
      setProductName(text);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Product Name *</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={handleNameChange}
        placeholder="Enter Product Name"
        placeholderTextColor="#9ca3af"
        maxLength={100}
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Text style={styles.characterCount}>{productName.length}/100</Text>
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
