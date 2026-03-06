// src/create/product/addprice.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { useAddProductContext, PriceType } from './addproductcontext';

const PRICE_OPTIONS: { type: PriceType; label: string; description: string }[] = [
  { type: 'fixed', label: 'Fixed', description: 'Set a single price' },
  { type: 'sale', label: 'Sale', description: 'Set original and sale price' },
  { type: 'sold_out', label: 'Sold Out', description: 'Optional historical price' },
  { type: 'tbd', label: 'TBD', description: 'Price to be determined' },
  { type: 'na', label: 'N/A', description: 'Not applicable' },
];

export default function AddPrice() {
  const {
    priceType,
    price,
    originalPrice,
    setPriceType,
    setPrice,
    setOriginalPrice,
  } = useAddProductContext();
  
  const [showPicker, setShowPicker] = useState(false);

  const handlePriceTypeSelect = (type: PriceType) => {
    setPriceType(type);
    setShowPicker(false);
  };

  const handlePriceChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setPrice(cleaned);
  };

  const handleOriginalPriceChange = (text: string) => {
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    setOriginalPrice(cleaned);
  };

  const getDisplayText = () => {
    const option = PRICE_OPTIONS.find(opt => opt.type === priceType);
    return option ? option.label : 'Fixed';
  };

  const showPriceInput = priceType === 'fixed' || priceType === 'sale' || priceType === 'sold_out';
  const showOriginalPriceInput = priceType === 'sale';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Price *</Text>
      
      {/* Price Type Selector */}
      <Pressable
        style={styles.priceTypeButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.priceTypeText}>{getDisplayText()}</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {/* Price Inputs */}
      {showPriceInput && (
        <View style={styles.priceInputContainer}>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={handlePriceChange}
            placeholder={priceType === 'sold_out' ? "0.00 (optional)" : "0.00"}
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="done"
            blurOnSubmit={true}
          />
          <Text style={styles.currencySymbol}>$</Text>
        </View>
      )}

      {showOriginalPriceInput && (
        <View style={styles.priceInputContainer}>
          <Text style={styles.originalPriceLabel}>Original Price</Text>
          <TextInput
            style={styles.priceInput}
            value={originalPrice}
            onChangeText={handleOriginalPriceChange}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="done"
            blurOnSubmit={true}
          />
          <Text style={styles.currencySymbol}>$</Text>
        </View>
      )}

      {/* Price Type Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setShowPicker(false)} style={styles.pickerHeaderButton}>
              <Text style={styles.pickerHeaderButtonText}>Cancel</Text>
            </Pressable>
            <Text style={styles.pickerHeaderTitle}>Select Price Type</Text>
            <View style={styles.pickerHeaderButton} />
          </View>

          <ScrollView style={styles.pickerContent}>
            {PRICE_OPTIONS.map((option) => (
              <Pressable
                key={option.type}
                style={[
                  styles.optionItem,
                  priceType === option.type && styles.optionItemSelected,
                ]}
                onPress={() => handlePriceTypeSelect(option.type)}
              >
                <View style={styles.optionContent}>
                  <Text style={[
                    styles.optionLabel,
                    priceType === option.type && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    priceType === option.type && styles.optionDescriptionSelected,
                  ]}>
                    {option.description}
                  </Text>
                </View>
                {priceType === option.type && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  priceTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  priceTypeText: {
    fontSize: 16,
    color: '#111827',
  },
  chevron: {
    fontSize: 18,
    color: '#6b7280',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
    textAlign: 'right',
  },
  currencySymbol: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    fontWeight: '600',
  },
  originalPriceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 12,
    minWidth: 100,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerHeaderButton: {
    padding: 8,
    minWidth: 60,
  },
  pickerHeaderButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  pickerContent: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#3b82f6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionDescriptionSelected: {
    color: '#1e40af',
  },
  checkmark: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: '600',
  },
});
