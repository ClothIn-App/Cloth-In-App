// src/create/product/productname.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddProductContext } from './addproductcontext';
import { searchProducts } from '@/src/services/searchApi';
import type { ProductSearchResult } from '@/src/types/search';
import type { ProductSearchFilters } from '@/src/services/search/types';

const SEARCH_DEBOUNCE_MS = 280;
const SEARCH_MIN_CHARS = 2;
const RESULT_LIMIT = 15;

const BRAND_FIRST_MESSAGE = 'Please Insert a Brand First';

export default function ProductName() {
  const {
    brand,
    category,
    productName,
    setProductName,
    selectedBrandId,
    isBrandConfirmed,
    isProductConfirmed,
    confirmProductName,
    clearProductSelection,
  } = useAddProductContext();
  const [suggestions, setSuggestions] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestedRef = useRef<string>('');

  const brandScopeFilters = React.useMemo((): ProductSearchFilters => {
    const cat = category.trim();
    const base: ProductSearchFilters =
      selectedBrandId != null
        ? { brandId: selectedBrandId }
        : { brandDisplayName: brand.trim() };
    if (cat) {
      base.categoryPath = cat;
    }
    return base;
  }, [selectedBrandId, brand, category]);

  const runSearch = useCallback(
    async (q: string) => {
      lastRequestedRef.current = q;
      setLoading(true);
      try {
        const res = await searchProducts(q, brandScopeFilters, 'relevance', null);
        if (lastRequestedRef.current !== q) return;
        const items = (res.items ?? []).slice(0, RESULT_LIMIT);
        setSuggestions(items);
      } catch {
        if (lastRequestedRef.current === q) {
          setSuggestions([]);
        }
      } finally {
        if (lastRequestedRef.current === q) {
          setLoading(false);
        }
      }
    },
    [brandScopeFilters]
  );

  useEffect(() => {
    if (!isBrandConfirmed || isProductConfirmed) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSuggestions([]);
      setLoading(false);
      lastRequestedRef.current = '';
      return;
    }

    const trimmed = productName.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length < SEARCH_MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      lastRequestedRef.current = '';
      return;
    }

    debounceRef.current = setTimeout(() => {
      const q = trimmed;
      void runSearch(q);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [productName, runSearch, isBrandConfirmed, isProductConfirmed]);

  const handleNameChange = (text: string) => {
    if (text.length <= 100) {
      setProductName(text);
    }
  };

  const handlePick = (hit: ProductSearchResult) => {
    confirmProductName(hit.name);
    setSuggestions([]);
  };

  const handleCommitTyped = () => {
    const t = productName.trim();
    if (!t) return;
    confirmProductName(t);
    setSuggestions([]);
  };

  const showPanel =
    isBrandConfirmed &&
    !isProductConfirmed &&
    productName.trim().length >= 1;
  const trimmed = productName.trim();
  const filteredSuggestions = suggestions.filter(
    (hit) => hit.name.trim().toLowerCase() !== trimmed.toLowerCase()
  );

  const showBrandFirstAlert = () => {
    Alert.alert('', BRAND_FIRST_MESSAGE);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Product Name *</Text>
      {!isBrandConfirmed ? (
        <Pressable
          onPress={showBrandFirstAlert}
          style={({ pressed }) => [pressed && styles.lockedPressed]}
        >
          <TextInput
            style={[styles.input, styles.inputLocked]}
            value=""
            editable={false}
            placeholder="Enter product name"
            placeholderTextColor="#9ca3af"
            pointerEvents="none"
          />
        </Pressable>
      ) : isProductConfirmed ? (
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel} numberOfLines={2}>
            {productName.trim()}
          </Text>
          <Pressable
            onPress={clearProductSelection}
            style={({ pressed }) => [styles.chipClear, pressed && styles.chipClearPressed]}
            accessibilityLabel="Clear product name"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color="#6b7280" />
          </Pressable>
        </View>
      ) : (
        <>
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
        </>
      )}

      {showPanel ? (
        <View style={styles.suggestionsBox}>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestionsScroll}>
            {loading ? <ActivityIndicator style={styles.loader} color="#6b7280" /> : null}
            {!loading
              ? filteredSuggestions.map((hit) => (
                  <Pressable
                    key={hit.id}
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
  inputLocked: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
  },
  lockedPressed: {
    opacity: 0.92,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    minHeight: 48,
  },
  chipLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginRight: 8,
  },
  chipClear: {
    padding: 2,
  },
  chipClearPressed: {
    opacity: 0.6,
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
