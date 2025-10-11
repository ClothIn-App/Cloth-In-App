import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Text,
  FlatList,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import trendingSearchesData from '../src/mocks/trendingSearches.json';

export default function SearchModalScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showTrending, setShowTrending] = useState(true);
  const searchInputRef = useRef<TextInput>(null);

  // Mock search suggestions based on query
  const getSearchSuggestions = (searchQuery: string) => {
    if (!searchQuery.trim()) return [];
    
    return trendingSearchesData.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  };

  const suggestions = getSearchSuggestions(query);

  const handleSearchPress = () => {
    if (query.trim()) {
      // Perform search
      console.log('Searching for:', query);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    searchInputRef.current?.focus();
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setShowTrending(text.trim() === '');
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowTrending(query.trim() === '');
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const renderTrendingItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="trending-up" size={16} color="#666A70" style={styles.trendingIcon} />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="search" size={16} color="#666A70" style={styles.suggestionIcon} />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with back button and search bar inline */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#666A70" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search ClothIn..."
            placeholderTextColor="#666A70"
            value={query}
            onChangeText={handleQueryChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSearchPress}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setQuery('');
                setShowTrending(true);
                searchInputRef.current?.blur();
              }}
            >
              <Ionicons name="close" size={18} color="#666A70" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Content Area */}
      <View style={styles.contentContainer}>
        {showTrending ? (
          <View style={styles.trendingContainer}>
            <Text style={styles.trendingTitle}>Trending Searches</Text>
            <FlatList
              data={trendingSearchesData}
              renderItem={renderTrendingItem}
              keyExtractor={(item, index) => `trending-${index}`}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <View style={styles.suggestionsContainer}>
            {suggestions.length > 0 && (
              <>
                <Text style={styles.suggestionsTitle}>Suggestions</Text>
                <FlatList
                  data={suggestions}
                  renderItem={renderSuggestionItem}
                  keyExtractor={(item, index) => `suggestion-${index}`}
                  showsVerticalScrollIndicator={false}
                />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E3E7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 24,
    color: '#11181C',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  trendingContainer: {
    flex: 1,
    paddingTop: 20,
  },
  trendingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 16,
  },
  trendingIcon: {
    marginRight: 12,
  },
  suggestionsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#11181C',
  },
});
