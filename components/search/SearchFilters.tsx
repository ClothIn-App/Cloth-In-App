import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { SearchCategory } from '@/src/types/search';

interface SearchFiltersProps {
  selectedCategory: SearchCategory;
  onCategoryChange: (category: SearchCategory) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
}

const CATEGORIES: { key: SearchCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '🔍' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'fitpics', label: 'FitPics', icon: '📸' },
  { key: 'products', label: 'Products', icon: '🛍️' },
  { key: 'hashtags', label: 'Hashtags', icon: '#' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'newest', label: 'Newest' },
  { key: 'most_liked', label: 'Most Liked' },
  { key: 'most_saved', label: 'Most Saved' },
];

export default function SearchFilters({ 
  selectedCategory, 
  onCategoryChange, 
  sortBy = 'relevance',
  onSortChange 
}: SearchFiltersProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';
  const pillActiveColor = '#E1E1E6';
  const pillInactiveColor = '#F2F2F5';

  return (
    <View style={[styles.container, { backgroundColor: cardColor, borderColor }]}>
      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              {
                backgroundColor: selectedCategory === category.key ? pillActiveColor : pillInactiveColor,
                borderColor: selectedCategory === category.key ? textColor : borderColor,
              }
            ]}
            onPress={() => onCategoryChange(category.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryIcon}>
              {category.icon}
            </Text>
            <Text 
              style={[
                styles.categoryLabel,
                { 
                  color: selectedCategory === category.key ? textColor : mutedTextColor,
                  fontWeight: selectedCategory === category.key ? '600' : '400',
                }
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      {onSortChange && (
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: mutedTextColor }]}>
            Sort by:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptionsContainer}
          >
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: sortBy === option.key ? pillActiveColor : pillInactiveColor,
                    borderColor: sortBy === option.key ? textColor : borderColor,
                  }
                ]}
                onPress={() => onSortChange(option.key)}
                activeOpacity={0.7}
              >
                <Text 
                  style={[
                    styles.sortButtonText,
                    { 
                      color: sortBy === option.key ? textColor : mutedTextColor,
                      fontWeight: sortBy === option.key ? '600' : '400',
                    }
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sortLabel: {
    fontSize: 14,
    marginRight: 12,
  },
  sortOptionsContainer: {
    flex: 1,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 12,
  },
});
