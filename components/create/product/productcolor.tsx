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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddProductContext, COLOR_MAX_LEN } from './addproductcontext';
import { isColorOptionalForCategory } from './colorCategoryRules';
import { searchProductColors } from '@/src/services/searchApi';

const SEARCH_DEBOUNCE_MS = 280;
const PRODUCT_FIRST_MESSAGE = 'Please add a product name first';

export default function ProductColor() {
  const {
    category,
    brand,
    selectedBrandId,
    productName,
    color,
    setColor,
    confirmColor,
    clearColorSelection,
    isProductConfirmed,
    isColorConfirmed,
  } = useAddProductContext();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestedRef = useRef<string>('');

  const runSearch = useCallback(
    async (q: string) => {
      lastRequestedRef.current = q;
      setLoading(true);
      try {
        const colors = await searchProductColors(q, {
          productName: productName.trim(),
          categoryPath: category,
          brandId: selectedBrandId,
          brandDisplayName: brand.trim(),
          limit: 20,
        });
        if (lastRequestedRef.current !== q) return;
        setSuggestions(colors);
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
    [productName, category, brand, selectedBrandId]
  );

  useEffect(() => {
    if (!isProductConfirmed || isColorConfirmed) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSuggestions([]);
      setLoading(false);
      lastRequestedRef.current = '';
      return;
    }

    const trimmed = color.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length < 1) {
      setSuggestions([]);
      setLoading(false);
      lastRequestedRef.current = '';
      return;
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [color, runSearch, isProductConfirmed, isColorConfirmed]);

  const optional = isColorOptionalForCategory(category);
  const label = optional ? 'Color' : 'Color *';
  const placeholder = optional ? 'Optional' : 'Enter color';

  const handleChange = (text: string) => {
    if (text.length <= COLOR_MAX_LEN) {
      setColor(text);
    }
  };

  const handlePick = (value: string) => {
    Keyboard.dismiss();
    confirmColor(value);
    setSuggestions([]);
  };

  const handleCommitTyped = () => {
    const t = color.trim();
    if (!t) return;
    Keyboard.dismiss();
    confirmColor(t);
    setSuggestions([]);
  };

  const showProductFirstAlert = () => {
    Alert.alert('', PRODUCT_FIRST_MESSAGE);
  };

  const showPanel =
    isProductConfirmed && !isColorConfirmed && color.trim().length >= 1;
  const trimmed = color.trim();
  const filteredSuggestions = suggestions.filter(
    (hit) => hit.trim().toLowerCase() !== trimmed.toLowerCase()
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {!isProductConfirmed ? (
        <Pressable
          onPress={showProductFirstAlert}
          style={({ pressed }) => [pressed && styles.lockedPressed]}
        >
          <TextInput
            style={[styles.input, styles.inputLocked]}
            value=""
            editable={false}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            pointerEvents="none"
          />
        </Pressable>
      ) : isColorConfirmed ? (
        <View style={styles.chipRow}>
          <Text style={styles.chipLabel} numberOfLines={2}>
            {color.trim()}
          </Text>
          <Pressable
            onPress={clearColorSelection}
            style={({ pressed }) => [styles.chipClear, pressed && styles.chipClearPressed]}
            accessibilityLabel="Clear color"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color="#6b7280" />
          </Pressable>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            maxLength={COLOR_MAX_LEN}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Text style={styles.characterCount}>{color.length}/{COLOR_MAX_LEN}</Text>
        </>
      )}

      {showPanel ? (
        <View style={styles.suggestionsBox}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            style={styles.suggestionsScroll}
          >
            {loading ? <ActivityIndicator style={styles.loader} color="#6b7280" /> : null}
            {!loading
              ? filteredSuggestions.map((hit, index) => (
                  <Pressable
                    key={`${hit}-${index}`}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      pressed && styles.suggestionRowPressed,
                    ]}
                    onPress={() => handlePick(hit)}
                  >
                    <Text style={styles.suggestionText}>{hit}</Text>
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
