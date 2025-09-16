// src/create/post/components/ProductPicker.tsx
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';
import { usePost } from './postcontext';
import { ProductLite } from './types';

export type ProductPickerProps = {
  /** Optional override of selected products; if omitted, uses PostContext */
  selected?: ProductLite[];
  /** Optional add/remove handlers; if omitted, uses PostContext */
  onAdd?: (p: ProductLite) => void;
  onRemove?: (id: string) => void;
  /** Optional suggestion dataset for the dropdown (purely presentational) */
  suggestions?: ProductLite[];
  /** Placeholder text for the search box */
  placeholder?: string;
};

export default function ProductPicker({
  selected,
  onAdd,
  onRemove,
  suggestions,
  placeholder = 'Search products',
}: ProductPickerProps) {
  const { meta, addProduct, removeProduct } = usePost();
  const selectedProducts = selected ?? meta.products;
  const handleAdd = onAdd ?? addProduct;
  const handleRemove = onRemove ?? removeProduct;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const filteredSuggestions = useMemo(() => {
    const base = suggestions ?? [];
    if (!query.trim()) return base.slice(0, 6);
    const q = query.trim().toLowerCase();
    return base.filter(p => (p.name ?? '').toLowerCase().includes(q)).slice(0, 6);
  }, [suggestions, query]);

  const makeTempId = () =>
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const addNewFromQuery = () => {
    const name = query.trim() || 'New product';
    handleAdd({ id: makeTempId(), name });
    setQuery('');
    setOpen(false);
    Keyboard.dismiss();
  };

  const addFromSuggestion = (p: ProductLite) => {
    handleAdd(p);
    setQuery('');
    setOpen(false);
    Keyboard.dismiss();
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
        onSubmitEditing={addNewFromQuery}
      />

      {/* Simple dropdown — always shows an action row to add new */}
      {open && (
        <View style={styles.dropdown}>
          {/* Optional suggestion rows */}
          {filteredSuggestions.map(s => (
            <TouchableOpacity
              key={s.id}
              style={styles.dropdownItem}
              onPress={() => addFromSuggestion(s)}
              activeOpacity={0.7}
            >
              <Text numberOfLines={1} style={styles.dropdownText}>
                {s.name ?? 'Untitled'}
              </Text>
              <Text style={styles.addHint}>Add</Text>
            </TouchableOpacity>
          ))}

          {/* Always-present action row */}
          <TouchableOpacity
            style={[styles.dropdownItem, styles.addRow]}
            onPress={addNewFromQuery}
            activeOpacity={0.7}
          >
            <Text numberOfLines={1} style={[styles.dropdownText, styles.addText]}>
              + Add {query.trim() ? `“${query.trim()}”` : 'product'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tiny readout of currently selected count (persists via context) */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Selected: {selectedProducts.length}
        </Text>

        {selectedProducts.length > 0 && (
          <FlatList
            horizontal
            data={selectedProducts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.chips}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.chip}>
                <Text numberOfLines={1} style={styles.chipText}>
                  {item.name ?? 'Unnamed'}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(item.id)}
                  style={styles.chipX}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.chipXText}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
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
  dropdownText: { fontSize: 16, flex: 1, marginRight: 8 },
  addRow: { backgroundColor: '#F8FAFC' },
  addText: { fontWeight: '600' },
  addHint: { fontSize: 12, color: '#64748B' },

  footer: { marginTop: 10 },
  footerText: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  chips: { paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 180,
  },
  chipText: { fontSize: 13, flexShrink: 1 },
  chipX: { marginLeft: 6 },
  chipXText: { fontSize: 14, fontWeight: '700' },
});