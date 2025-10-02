import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '@/src/hooks/useSearch';
import { SearchSuggestion } from '@/src/types/search';
import SearchSuggestions from './SearchSuggestions';
import SearchResults from './SearchResults';
import { MOCK_TRENDING_SEARCHES } from '@/src/mocks/searchMocks';

const { height: screenHeight } = Dimensions.get('window');

export default function SearchBar() {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMainScreen, setShowMainScreen] = useState(true);
  
  const searchInputRef = useRef<TextInput>(null);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const {
    query,
    isSearching,
    results,
    suggestions,
    recentSearches,
    trendingSearches,
    filters,
    hasSearched,
    hasResults,
    search,
    setQuery,
    clearRecentSearches,
    clearError,
  } = useSearch();

  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';
  const backgroundColor = '#FFFFFF';

  // Reset to main screen when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setShowMainScreen(true);
      setShowSuggestions(false);
      setIsFocused(false);
      setQuery('');
      searchInputRef.current?.blur();
    }, [])
  );

  // Initialize trending searches
  useEffect(() => {
    // In a real app, this would come from the API
    // For now, we'll use the mock data
  }, []);

  const showSuggestionsPanel = () => {
    setShowSuggestions(true);
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideSuggestionsPanel = () => {
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuggestions(false);
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowMainScreen(false);
    showSuggestionsPanel();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for touch events
    setTimeout(() => {
      if (!isFocused) {
        // If no search was performed, show trending suggestions
        if (!hasSearched) {
          setShowMainScreen(false);
          setShowSuggestions(true);
          showSuggestionsPanel();
        } else {
          hideSuggestionsPanel();
        }
      }
    }, 150);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (text.trim()) {
      showSuggestionsPanel();
    }
  };

  const handleSearchSubmit = () => {
    if (query.trim()) {
      search(query.trim());
      hideSuggestionsPanel();
      Keyboard.dismiss();
    } else {
      // If empty search, show trending suggestions
      setShowMainScreen(false);
      setShowSuggestions(true);
      showSuggestionsPanel();
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    search(suggestion.text);
    hideSuggestionsPanel();
    Keyboard.dismiss();
  };

  const handleRecentSearchPress = (searchText: string) => {
    setQuery(searchText);
    search(searchText);
    hideSuggestionsPanel();
    Keyboard.dismiss();
  };

  const handleClearSearch = () => {
    setQuery('');
    setShowMainScreen(true);
    setShowSuggestions(false);
    setIsFocused(false);
    searchInputRef.current?.blur();
  };

  const handleKeyboardDismiss = () => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
  };


  const slideHeight = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenHeight * 0.6],
  });

  const renderContent = () => {
    if (showMainScreen) {
      // Main screen - empty for now, will have content in the future
      return (
        <View style={styles.mainScreenContainer}>
          <Text style={[styles.mainScreenText, { color: mutedTextColor }]}>
            Search for users, products, fitpics, and more
          </Text>
        </View>
      );
    }

    if (hasSearched) {
      return (
        <SearchResults
          results={results}
          category={filters.category}
          isSearching={isSearching}
          onUserPress={(user) => console.log('User pressed:', user)}
          onUserFollow={(userId) => console.log('Follow user:', userId)}
          onProductPress={(product) => console.log('Product pressed:', product)}
          onProductPurchase={(product) => console.log('Purchase product:', product)}
          onHashtagPress={(hashtag) => console.log('Hashtag pressed:', hashtag)}
          onFitPicPress={(fitpic) => console.log('FitPic pressed:', fitpic)}
          onFitPicUserPress={(userId) => console.log('FitPic user pressed:', userId)}
          onFitPicProductPress={(productId) => console.log('FitPic product pressed:', productId)}
        />
      );
    }

    if (showSuggestions) {
      return (
        <SearchSuggestions
          suggestions={suggestions}
          recentSearches={recentSearches}
          trendingSearches={MOCK_TRENDING_SEARCHES}
          onSuggestionPress={handleSuggestionPress}
          onRecentSearchPress={handleRecentSearchPress}
          onClearRecent={clearRecentSearches}
          showRecent={!query.trim()}
          showTrending={!query.trim()}
        />
      );
    }

    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={handleKeyboardDismiss}>
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={18} color={mutedTextColor} style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search ClothIn..."
              placeholderTextColor={mutedTextColor}
              value={query}
              onChangeText={handleQueryChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close" size={18} color={mutedTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 24,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
  },
  mainScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  mainScreenText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
