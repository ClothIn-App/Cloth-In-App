// src/create/product/link.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAddProductContext } from './addproductcontext';

export default function ProductLink() {
  const { link, setLink } = useAddProductContext();

  const isValidUrl = (url: string) => {
    if (!url || !url.trim()) return true; // Empty is valid (optional field)
    const trimmed = url.trim();
    try {
      new URL(trimmed);
      return true;
    } catch {
      // Accept URLs without protocol (e.g. nike.com) by trying with https://
      try {
        new URL(`https://${trimmed}`);
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleLinkChange = (text: string) => {
    setLink(text);
  };

  const hasError = link.length > 0 && !isValidUrl(link);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Product Link</Text>
      <TextInput
        style={[styles.input, hasError && styles.inputError]}
        value={link}
        onChangeText={handleLinkChange}
        placeholder="example.com or https://example.com/product"
        placeholderTextColor="#9ca3af"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="url"
      />
      {hasError && (
        <Text style={styles.errorText}>Please enter a valid URL</Text>
      )}
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
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
});
