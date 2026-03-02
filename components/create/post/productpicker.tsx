// src/create/post/components/ProductPicker.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import ProgressiveImage from '../../common/ProgressiveImage';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from './postcontext';
import { ProductLite } from './types';

export type ProductPickerProps = {
  /** Optional override of selected products; if omitted, uses PostContext */
  selected?: ProductLite[];
  /** Optional add/remove handlers; if omitted, uses PostContext */
  onAdd?: (p: ProductLite) => void;
  onRemove?: (id: string) => void;
  /** Optional suggestion dataset for the dropdown (from API; show up to 4) */
  suggestions?: ProductLite[];
  /** Placeholder text for the search box */
  placeholder?: string;
  /** Controlled search: when both provided, parent owns query for API search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** When true, show "Searching..." in dropdown */
  searchLoading?: boolean;
  /** When provided, 5th row is "Add new product" and calls this (hidden when 6 selected) */
  onAddNewProduct?: () => void;
};

export default function ProductPicker({
  selected,
  onAdd,
  onRemove,
  suggestions,
  placeholder = 'Search products',
  searchValue,
  onSearchChange,
  searchLoading = false,
  onAddNewProduct,
}: ProductPickerProps) {
  const { meta, addProduct, removeProduct } = usePost();
  const selectedProducts = selected ?? meta.products;
  const handleAdd = onAdd ?? addProduct;
  const handleRemove = onRemove ?? removeProduct;

  const [internalQuery, setInternalQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isControlled = searchValue !== undefined && onSearchChange !== undefined;
  const query = isControlled ? (searchValue ?? '') : internalQuery;
  const setQuery = isControlled ? (onSearchChange ?? (() => {})) : setInternalQuery;

  const suggestionList = (suggestions ?? []).slice(0, 4);
  const showEmptyState =
    !searchLoading && query.trim().length >= 2 && suggestionList.length === 0;
  const showAddNewProductRow =
    onAddNewProduct !== undefined ? selectedProducts.length < 6 : true;

  const makeTempId = () =>
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const addNewFromQuery = () => {
    const name = query.trim() || 'New product';
    handleAdd({ id: makeTempId(), name });
    if (!isControlled) setInternalQuery('');
    onSearchChange?.('');
    setOpen(false);
    Keyboard.dismiss();
  };

  const addFromSuggestion = (p: ProductLite) => {
    handleAdd(p);
    if (!isControlled) setInternalQuery('');
    onSearchChange?.('');
    setOpen(false);
    Keyboard.dismiss();
  };

  const handleAddNewProductPress = () => {
    if (onAddNewProduct && selectedProducts.length < 6) {
      onAddNewProduct();
      setOpen(false);
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChangeText={t => {
          setQuery(t);
          if (!open) setOpen(true);
        }}
        returnKeyType="search"
        onSubmitEditing={onAddNewProduct ? undefined : addNewFromQuery}
      />

      {/* Simple dropdown — always shows an action row to add new */}
      {open && (
        <View style={styles.dropdown}>
          {searchLoading && (
            <View style={styles.dropdownItem}>
              <ActivityIndicator size="small" color="#64748B" />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          )}

          {!searchLoading && showEmptyState && (
            <View style={styles.dropdownItem}>
              <Text style={styles.emptyStateText}>No products found</Text>
            </View>
          )}

          {suggestionList.map(s => (
            <TouchableOpacity
              key={s.id}
              style={styles.suggestionRow}
              onPress={() => addFromSuggestion(s)}
              activeOpacity={0.7}
            >
              <View style={styles.suggestionThumb}>
                {s.imageUrl ? (
                  <ProgressiveImage
                    source={{ uri: s.imageUrl }}
                    style={styles.suggestionThumbImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.suggestionThumbPlaceholder}>
                    <Ionicons name="shirt-outline" size={20} color="#9ca3af" />
                  </View>
                )}
              </View>
              <View style={styles.suggestionTextWrap}>
                <Text numberOfLines={1} style={styles.suggestionBrand}>
                  {s.brand ?? 'Brand'}
                </Text>
                <Text numberOfLines={1} style={styles.dropdownText}>
                  {s.name ?? 'Untitled'}
                </Text>
              </View>
              <Text style={styles.addHint}>Add</Text>
            </TouchableOpacity>
          ))}

          {onAddNewProduct ? (
            showAddNewProductRow && (
              <TouchableOpacity
                style={[styles.dropdownItem, styles.addRow]}
                onPress={handleAddNewProductPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownText, styles.addText]}>
                  Add New Product
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.dropdownItem, styles.addRow]}
              onPress={addNewFromQuery}
              activeOpacity={0.7}
            >
            <Text numberOfLines={1} style={[styles.dropdownText, styles.addText]}>
              + Add {query.trim() ? `“${query.trim()}”` : 'product'}
            </Text>
          </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Selected: {selectedProducts.length}
        </Text>

      </View>
    </View>
  );
}

const BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dropdown: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  suggestionThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 10,
  },
  suggestionThumbImage: {
    width: '100%',
    height: '100%',
  },
  suggestionThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionTextWrap: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  suggestionBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  dropdownText: { fontSize: 16, flex: 1, marginRight: 8 },
  addRow: { backgroundColor: '#F8FAFC' },
  addText: { fontWeight: '600' },
  addHint: { fontSize: 12, color: '#64748B' },
  searchingText: { fontSize: 14, color: '#64748B', marginLeft: 8 },
  emptyStateText: { fontSize: 14, color: '#64748B' },

  footer: { marginTop: 10 },
  footerText: { fontSize: 12, color: '#64748B', marginBottom: 6 },
});