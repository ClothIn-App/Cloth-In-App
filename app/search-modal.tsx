import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { getSuggestions, getTrending, getRecents, clearRecents, type RecentSearchItem } from '../src/services/searchApi';
import type { SearchSuggestion } from '../src/types/search';

export default function SearchModalScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [trending, setTrending] = useState<SearchSuggestion[]>([]);
  const [recents, setRecents] = useState<RecentSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [isNoConnection, setIsNoConnection] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmpty = query.trim() === '';

  // Load recents and trending for empty state
  useEffect(() => {
    if (isEmpty) {
      loadEmptyState();
    }
  }, []);

  const loadEmptyState = async () => {
    try {
      const [recentsData, trendingData] = await Promise.all([
        getRecents(),
        getTrending(),
      ]);
      setRecents(recentsData.filter(item => item.type === 'query').slice(0, 5));
      setTrending(trendingData);
    } catch (error) {
      console.error('Error loading empty state:', error);
    }
  };

  // Debounced search suggestions
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSuggestionsError(null);
      setIsNoConnection(false);
      await loadEmptyState();
      return;
    }

    setLoading(true);
    setSuggestionsError(null);
    setIsNoConnection(false);
    try {
      const results = await getSuggestions(searchQuery);
      setSuggestions(results);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load suggestions';
      setSuggestionsError(errorMessage);
      setIsNoConnection(errorMessage.toLowerCase().includes('connection') || errorMessage.toLowerCase().includes('internet'));
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce handler
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      loadSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, loadSuggestions]);

  const handleSearchPress = () => {
    if (query.trim()) {
      // Navigate to search results page
      router.push({
        pathname: '/search-results',
        params: { q: query.trim() },
      });
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion | string) => {
    // Handle both SearchSuggestion type and legacy string type
    const suggestionText = typeof suggestion === 'string' 
      ? suggestion.trim() 
      : suggestion.text.trim();
    
    router.push({
      pathname: '/search-results',
      params: { q: suggestionText },
    });
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClearRecents = async () => {
    try {
      await clearRecents();
      // Reload empty state to refresh recents list
      await loadEmptyState();
    } catch (error) {
      console.error('Error clearing recents:', error);
    }
  };

  const renderRecentItem = ({ item }: { item: RecentSearchItem }) => {
    if (item.type !== 'query') return null;
    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress({ id: `recent-${item.text}`, text: item.text, type: 'recent' })}
      >
        <Ionicons name="time-outline" size={16} color="#666A70" style={styles.suggestionIcon} />
        <Text style={styles.suggestionText}>{item.text}</Text>
      </TouchableOpacity>
    );
  };

  const renderTrendingItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="trending-up" size={16} color="#666A70" style={styles.trendingIcon} />
      <Text style={styles.suggestionText}>{item.text}</Text>
    </TouchableOpacity>
  );

  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => {
    let iconName = 'search';
    if (item.type === 'recent') {
      iconName = 'time-outline';
    } else if (item.type === 'trending') {
      iconName = 'trending-up';
    }

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        <Ionicons name={iconName as any} size={16} color="#666A70" style={styles.suggestionIcon} />
        <Text style={styles.suggestionText}>{item.text}</Text>
      </TouchableOpacity>
    );
  };

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
                setSuggestions([]);
                loadEmptyState();
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
        {isEmpty ? (
          <View style={styles.emptyStateContainer}>
            {/* Recents Section */}
            {recents.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <TouchableOpacity onPress={handleClearRecents} style={styles.clearRecentsButton}>
                    <Text style={styles.clearRecentsButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={recents}
                  renderItem={renderRecentItem}
                  keyExtractor={(item, index) => `recent-${index}`}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
            
            {/* Trending Section */}
            {trending.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trending</Text>
                <FlatList
                  data={trending}
                  renderItem={renderTrendingItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.suggestionsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : suggestionsError ? (
              <View style={styles.errorContainer}>
                <Ionicons 
                  name={isNoConnection ? "cloud-offline-outline" : "alert-circle-outline"} 
                  size={40} 
                  color="#ef4444" 
                />
                <Text style={styles.errorTitle}>
                  {isNoConnection ? 'No Connection' : 'Error'}
                </Text>
                <Text style={styles.errorMessage}>
                  {isNoConnection 
                    ? 'Please check your internet connection.'
                    : suggestionsError}
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => loadSuggestions(query)}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : suggestions.length > 0 ? (
              <>
                <Text style={styles.suggestionsTitle}>Suggestions</Text>
                <FlatList
                  data={suggestions}
                  renderItem={renderSuggestionItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </>
            ) : (
              <View style={styles.emptySuggestions}>
                <Text style={styles.emptyText}>No suggestions found</Text>
              </View>
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
  emptyStateContainer: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  clearRecentsButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearRecentsButtonText: {
    fontSize: 14,
    color: '#666A70',
    fontWeight: '500',
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666A70',
  },
  emptySuggestions: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666A70',
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
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666A70',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#11181C',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
