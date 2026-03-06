// src/create/product/categoryselect.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAddProductContext } from './addproductcontext';

const CATEGORIES = {
  'Clothing': {
    'Tops': ['T-shirts', 'Tanks', 'Blouses/Shirts', 'Sweaters/Hoodies', 'Bodysuits'],
    'Bottoms': ['Jeans', 'Pants', 'Leggings', 'Shorts', 'Skirts'],
    'Dresses & Jumpsuits': ['Dresses', 'Jumpsuits/Rompers'],
    'Outerwear': ['Jackets', 'Coats', 'Blazers', 'Vests', 'Rainwear'],
    'Sets & Co-ords': [],
    'Swim & Cover-ups': [],
    'Intimates & Loungewear': ['Bras', 'Underwear', 'Lingerie', 'Sleepwear', 'Loungewear'],
    'Activewear': ['Sports Bras', 'Leggings', 'Tops', 'Sets'],
    'Maternity': ['Tops', 'Bottoms', 'Dresses'],
  },
  'Footwear': {
    'Sneakers': [],
    'Boots': [],
    'Heels': [],
    'Flats': [],
    'Sandals': [],
    'Slippers': [],
  },
  'Bags': {
    'Shoulder': [],
    'Crossbody': [],
    'Tote': [],
    'Backpack': [],
    'Mini/Micro': [],
    'Wallets/Cardholders': [],
  },
  'Jewelry': {
    'Necklaces': [],
    'Earrings': [],
    'Rings': [],
    'Bracelets': [],
    'Anklets': [],
    'Watches': [],
    'Body Jewelry': [],
  },
  'Accessories': {
    'Sunglasses': [],
    'Hats/Beanies': [],
    'Scarves': [],
    'Belts': [],
    'Socks/Tights': [],
    'Gloves/Mittens': [],
    'Hair Accessories': ['Clips', 'Scrunchies', 'Headbands'],
    'Phone Cases & Charms': [],
  },
  'Beauty → Makeup': {
    'Face': ['Foundation', 'Concealer', 'Primer', 'Powder'],
    'Eyes': ['Mascara', 'Liner', 'Shadow', 'Brows'],
    'Lips': ['Lipstick', 'Gloss', 'Balm', 'Liner'],
    'Cheeks': ['Blush', 'Bronzer', 'Highlighter'],
    'Palettes & Sets': [],
    'Tools & Brushes': ['Face/Eye/Lip'],
  },
  'Beauty → Skincare': {
    'Cleansers': [],
    'Toners/Essences': [],
    'Serums/Ampoules': [],
    'Moisturizers': [],
    'Sunscreen': [],
    'Treatments & Masks': ['Acids', 'Retinoids', 'Sheet/Clay'],
    'Eye & Lip Care': [],
    'Skincare Tools/Devices': ['Gua Sha/Rollers', 'Cleansing Brushes', 'LED/Microcurrent'],
  },
  'Beauty → Hair': {
    'Wash': ['Shampoo', 'Scalp Care'],
    'Conditioners/Masks': [],
    'Styling': ['Creams', 'Sprays', 'Oils'],
    'Hair Color': [],
    'Hair Tools': ['Dryers', 'Straighteners', 'Curlers', 'Brushes/Combs'],
  },
  'Beauty → Body & Fragrance': {
    'Body Wash/Scrub': [],
    'Lotions/Butters': [],
    'Deodorant': [],
    'Self-Tan & Sun Care': ['after-sun'],
    'Shave/Wax': [],
    'Fragrance': ['Perfume', 'Eau de Toilette', 'Body Mist', 'Discovery Sets'],
  },
  'Nails': {
    'Polish': ['Regular', 'Gel'],
    'Press-ons': [],
    'Nail Care': ['Treatments', 'Cuticle'],
  },
  'Fitness Gear': {
    'Apparel Accessories': ['Gym Towels', 'Socks'],
    'Gear': ['Yoga Mats', 'Resistance Bands', 'Jump Ropes', 'Water Bottles', 'Gym Bags'],
    'Tech & Wearables': ['Smartwatches/Fitness Trackers', 'Earbuds/Headphones'],
    'Wearable Accessories': ['Watch Bands', 'Cases'],
  },
  'Home & Decor': {
    'Candles & Home Fragrance': ['Diffusers'],
    'Vanity & Organization': ['Trays', 'Makeup Organizers'],
    'Small Decor': ['Vases', 'Trinket Dishes', 'Mirrors'],
    'Bedding/Pillows': ['Throw/Decorative'],
  },
  'Other / Not Listed': {},
};

type FlatCategoryEntry = { fullPath: string; main: string; sub?: string; item?: string };

function buildFlatCategoryList(): FlatCategoryEntry[] {
  const entries: FlatCategoryEntry[] = [];
  for (const [main, subCategories] of Object.entries(CATEGORIES)) {
    entries.push({ fullPath: main, main });
    for (const [sub, items] of Object.entries(subCategories)) {
      entries.push({ fullPath: `${main} > ${sub}`, main, sub });
      for (const item of items) {
        entries.push({ fullPath: `${main} > ${sub} > ${item}`, main, sub, item });
      }
    }
  }
  return entries;
}

const FLAT_CATEGORIES = buildFlatCategoryList();

export default function CategorySelect() {
  const { category, setCategory } = useAddProductContext();
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const handleCategorySelect = (mainCategory: string, subCategory?: string, item?: string) => {
    let fullCategory = mainCategory;
    if (subCategory) {
      fullCategory += ` > ${subCategory}`;
    }
    if (item) {
      fullCategory += ` > ${item}`;
    }
    setCategory(fullCategory);
    setShowPicker(false);
    setSearchQuery('');
    setSelectedMainCategory(null);
    setSelectedSubCategory(null);
  };

  const searchTrimmed = searchQuery.trim();
  const searchResults = React.useMemo(() => {
    if (!searchTrimmed) return [];
    const searchLower = searchTrimmed.toLowerCase();
    return FLAT_CATEGORIES.filter(
      (entry) =>
        entry.fullPath.toLowerCase().includes(searchLower) ||
        entry.main.toLowerCase().includes(searchLower) ||
        (entry.sub && entry.sub.toLowerCase().includes(searchLower)) ||
        (entry.item && entry.item.toLowerCase().includes(searchLower))
    );
  }, [searchTrimmed]);

  const filteredCategories = Object.entries(CATEGORIES).filter(([mainCategory, subCategories]) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      mainCategory.toLowerCase().includes(searchLower) ||
      Object.keys(subCategories).some(sub => sub.toLowerCase().includes(searchLower)) ||
      Object.values(subCategories).flat().some(item => item.toLowerCase().includes(searchLower))
    );
  });

  const getDisplayText = () => {
    if (!category) return 'Select Category';
    // Extract only the final category name (last part after >)
    const parts = category.split(' > ');
    return parts[parts.length - 1];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category *</Text>
      <Pressable
        style={[styles.input, !category && styles.inputPlaceholder]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={[styles.inputText, !category && styles.inputTextPlaceholder]}>
          {getDisplayText()}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal visible={showPicker} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.pickerContainer, { paddingTop: insets.top }]}>
          <View style={styles.pickerHeader}>
            <Pressable onPress={() => setShowPicker(false)} style={styles.pickerHeaderButton}>
              <Text style={styles.pickerHeaderButtonText}>Cancel</Text>
            </Pressable>
            <Text style={styles.pickerHeaderTitle}>Select Category</Text>
            <View style={styles.pickerHeaderButton} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Categories"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="done"
            />
          </View>

          <ScrollView
            style={styles.pickerContent}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            {searchTrimmed ? (
              searchResults.map((entry) => (
                <Pressable
                  key={entry.fullPath}
                  style={styles.mainCategoryItem}
                  onPress={() =>
                    handleCategorySelect(entry.main, entry.sub, entry.item)
                  }
                >
                  <View>
                    <Text style={styles.mainCategoryText}>
                      {entry.item ?? entry.sub ?? entry.main}
                    </Text>
                    {(entry.sub || entry.item) && (
                      <Text style={styles.searchResultBreadcrumb}>
                        {entry.main}
                        {entry.sub ? ` > ${entry.sub}` : ''}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))
            ) : (
            filteredCategories.map(([mainCategory, subCategories]) => (
              <View key={mainCategory}>
                <Pressable
                  style={styles.mainCategoryItem}
                  onPress={() => {
                    if (Object.keys(subCategories).length === 0) {
                      handleCategorySelect(mainCategory);
                    } else if (selectedMainCategory === mainCategory) {
                      setSelectedMainCategory(null);
                    } else {
                      setSelectedMainCategory(mainCategory);
                    }
                  }}
                >
                  <Text style={styles.mainCategoryText}>{mainCategory}</Text>
                  {Object.keys(subCategories).length > 0 && (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </Pressable>

                {selectedMainCategory === mainCategory && Object.keys(subCategories).length > 0 && (
                  <View style={styles.subCategoriesContainer}>
                    {Object.entries(subCategories).map(([subCategory, items]) => (
                      <View key={subCategory}>
                        <Pressable
                          style={styles.subCategoryItem}
                          onPress={() => {
                            if (items.length === 0) {
                              handleCategorySelect(mainCategory, subCategory);
                            } else if (selectedSubCategory === subCategory) {
                              setSelectedSubCategory(null);
                            } else {
                              setSelectedSubCategory(subCategory);
                            }
                          }}
                        >
                          <Text style={styles.subCategoryText}>{subCategory}</Text>
                          {items.length > 0 && <Text style={styles.chevron}>›</Text>}
                        </Pressable>

                        {selectedSubCategory === subCategory && items.length > 0 && (
                          <View style={styles.itemsContainer}>
                            {items.map((item) => (
                              <Pressable
                                key={item}
                                style={styles.item}
                                onPress={() => handleCategorySelect(mainCategory, subCategory, item)}
                              >
                                <Text style={styles.itemText}>{item}</Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
            )}
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
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: 'white',
  },
  inputPlaceholder: {
    borderColor: '#d1d5db',
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  inputTextPlaceholder: {
    color: '#9ca3af',
  },
  chevron: {
    fontSize: 18,
    color: '#6b7280',
    marginLeft: 8,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  pickerContent: {
    flex: 1,
  },
  mainCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mainCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  searchResultBreadcrumb: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  subCategoriesContainer: {
    backgroundColor: '#f9fafb',
  },
  subCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subCategoryText: {
    fontSize: 15,
    color: '#374151',
  },
  itemsContainer: {
    backgroundColor: '#f3f4f6',
  },
  item: {
    paddingHorizontal: 48,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
