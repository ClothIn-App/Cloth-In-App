// src/create/product/brandselect.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAddProductContext, BRAND_MAX_LEN } from './addproductcontext';
import { contentApiClient } from '@/src/services/apiClients/contentClient';
import type { BrandSearchHit } from '@/src/services/apiClients/contentClient';

const SEARCH_DEBOUNCE_MS = 280;

export default function BrandSelect() {
  const { brand, setBrand, setBrandFromSuggestion } = useAddProductContext();
  const [suggestions, setSuggestions] = useState<BrandSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await contentApiClient.searchBrands({ q, limit: 20 });
      setSuggestions(res.brands ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(brand.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [brand, runSearch]);

  const handleBrandChange = (text: string) => {
    if (text.length <= BRAND_MAX_LEN) {
      setBrand(text);
    }
  };

  const handlePick = (hit: BrandSearchHit) => {
    setBrandFromSuggestion(hit.name, hit.brandId);
    setSuggestions([]);
  };

  const handleCommitTyped = () => {
    const t = brand.trim();
    if (!t) return;
    setBrand(t);
    setSuggestions([]);
  };

  const showPanel = brand.trim().length >= 1;
  const trimmed = brand.trim();
  const filteredSuggestions = suggestions.filter(
    (hit) => hit.name.trim().toLowerCase() !== trimmed.toLowerCase()
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Brand *</Text>
      <TextInput
        style={styles.input}
        value={brand}
        onChangeText={handleBrandChange}
        placeholder="Enter brand or search"
        placeholderTextColor="#9ca3af"
        maxLength={BRAND_MAX_LEN}
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Text style={styles.characterCount}>{brand.length}/{BRAND_MAX_LEN}</Text>

      {showPanel ? (
        <View style={styles.suggestionsBox}>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestionsScroll}>
            {loading ? <ActivityIndicator style={styles.loader} color="#6b7280" /> : null}
            {!loading
              ? filteredSuggestions.map((hit) => (
                  <Pressable
                    key={hit.brandId}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && styles.suggestionRowPressed,
                    ]}
                    onPress={() => handlePick(hit)}
                  >
                    <Text style={styles.suggestionText}>{hit.name}</Text>
                  </Pressable>
                ))
              : null}
            <Pressable
              style={({ pressed }) => [
                styles.suggestionRow,
                styles.typedOptionRow,
                pressed && styles.suggestionRowPressed,
              ]}
              onPress={handleCommitTyped}
            >
              <Text style={styles.suggestionText}>{trimmed}</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}
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
  suggestionsBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    maxHeight: 220,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    maxHeight: 220,
  },
  loader: {
    paddingVertical: 16,
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  suggestionRowPressed: {
    backgroundColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#111827',
  },
  typedOptionRow: {
    borderBottomWidth: 0,
  },
});
