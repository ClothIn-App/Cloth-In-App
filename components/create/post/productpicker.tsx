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
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePost } from './postcontext';
import { ProductLite } from './types';
import { useProductSearch, mapToProductLite } from '../../../src/hooks/useProductSearch';
import type { ProductSearchResult } from '../../../src/types/search';

const ROW_HEIGHT = 52;
const DROPDOWN_VISIBLE_ROWS = 5;
const DROPDOWN_MAX_HEIGHT = ROW_HEIGHT * DROPDOWN_VISIBLE_ROWS;

const ADD_NEW_PRODUCT_ID = '__add_new_product__';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export type ProductPickerProps = {
  /** Optional override of selected products; if omitted, uses PostContext */
  selected?: ProductLite[];
  /** Optional add/remove handlers; if omitted, uses PostContext */
  onAdd?: (p: ProductLite) => void;
  onRemove?: (id: string) => void;
  /** Placeholder text for the search box */
  placeholder?: string;
};

type DropdownItem = ProductSearchResult | { id: string; name: string; isAddNew: true };

export default function ProductPicker({
  selected,
  onAdd,
  onRemove,
  placeholder = 'Search products',
}: ProductPickerProps) {
  const router = useRouter();
  const { meta, addProduct, removeProduct } = usePost();
  const selectedProducts = selected ?? meta.products;
  const handleAdd = onAdd ?? addProduct;
  const handleRemove = onRemove ?? removeProduct;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { products, loading, error } = useProductSearch(query, { enabled: open });

  const selectedIds = new Set(selectedProducts.map(p => p.id));
  const availableProducts = products.filter(p => !selectedIds.has(p.id));
  const dropdownData: DropdownItem[] = [
    ...availableProducts.slice(0, 4),
    { id: ADD_NEW_PRODUCT_ID, name: 'Add new product', isAddNew: true },
  ];

  const handleSelectProduct = (item: ProductSearchResult) => {
    handleAdd(mapToProductLite(item));
    setQuery('');
    setOpen(false);
    Keyboard.dismiss();
  };

  const handleAddNewProduct = () => {
    setOpen(false);
    Keyboard.dismiss();
    router.push('/create-modals/addproduct');
  };

  const closeDropdown = () => {
    setOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {open && (
        <Pressable
          style={[styles.overlay, { top: -SCREEN_HEIGHT, height: 2 * SCREEN_HEIGHT }]}
          onPress={closeDropdown}
        />
      )}
      <View style={styles.inputDropdownWrapper}>
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
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {open && (
          <View style={[styles.dropdown, { maxHeight: DROPDOWN_MAX_HEIGHT }]}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>Searching…</Text>
              </View>
            ) : error ? (
              <View style={styles.loadingRow}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.dropdownScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {dropdownData.map(item => {
                  if ('isAddNew' in item && item.isAddNew) {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.dropdownItem, styles.addRow]}
                        onPress={handleAddNewProduct}
                        activeOpacity={0.7}
                      >
                        <Text numberOfLines={1} style={[styles.dropdownText, styles.addText]}>
                          + {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  const product = item as ProductSearchResult;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectProduct(product)}
                      activeOpacity={0.7}
                    >
                      <Text numberOfLines={1} style={styles.dropdownText}>
                        {product.name ?? 'Untitled'}
                        {product.brand ? ` · ${product.brand}` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>

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
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
    backgroundColor: 'transparent',
  },
  inputDropdownWrapper: {
    position: 'relative',
    zIndex: 10,
    elevation: 10,
  },
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
    zIndex: 10,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: DROPDOWN_MAX_HEIGHT,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: ROW_HEIGHT - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  dropdownText: { fontSize: 16, flex: 1, marginRight: 8 },
  addRow: { backgroundColor: '#F8FAFC' },
  addText: { fontWeight: '600' },
  loadingRow: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 14, color: '#64748B' },
  errorText: { fontSize: 14, color: '#dc2626' },

  footer: { marginTop: 10 },
  footerText: { fontSize: 12, color: '#64748B' },
});
