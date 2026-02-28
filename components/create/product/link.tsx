// src/create/product/link.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAddProductContext } from './addproductcontext';

export function isValidProductUrl(url: string): boolean {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return /\.[a-z]{2,}$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export default function ProductLink() {
  const { link, setLink } = useAddProductContext();

  const handleLinkChange = (text: string) => {
    setLink(text);
  };

  const hasError = link.length > 0 && !isValidProductUrl(link);

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
