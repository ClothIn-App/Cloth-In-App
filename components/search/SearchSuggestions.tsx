import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Text, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchSuggestion } from '@/src/types/search';

const { height: screenHeight } = Dimensions.get('window');

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  trendingSearches: SearchSuggestion[];
  onSuggestionPress: (suggestion: SearchSuggestion) => void;
  onRecentSearchPress: (search: string) => void;
  onClearRecent: () => void;
  showRecent?: boolean;
  showTrending?: boolean;
}

export default function SearchSuggestions({
  suggestions,
  recentSearches,
  trendingSearches,
  onSuggestionPress,
  onRecentSearchPress,
  onClearRecent,
  showRecent = true,
  showTrending = true,
}: SearchSuggestionsProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';

  // Use all items without height restrictions
  const limitedRecentSearches = recentSearches;
  const limitedTrendingSearches = trendingSearches;
  const limitedSuggestions = suggestions;

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.category) {
      case 'users':
        return 'person-outline';
      case 'products':
        return 'bag-outline';
      case 'fitpics':
        return '📸';
      case 'hashtags':
        return '#';
      default:
        return suggestion.type === 'trending' ? 'flame-outline' : '🔍';
    }
  };

  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
      onPress={() => onSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        {getSuggestionIcon(item) === '#' || getSuggestionIcon(item) === '📸' || getSuggestionIcon(item) === '🔍' ? (
          <Text style={styles.suggestionIcon}>
            {getSuggestionIcon(item)}
          </Text>
        ) : (
          <Ionicons name={getSuggestionIcon(item) as any} size={16} color={textColor} style={styles.suggestionIcon} />
        )}
        <View style={styles.suggestionTextContainer}>
          <Text style={[styles.suggestionText, { color: textColor }]}>
            {item.text}
          </Text>
          {item.count && (
            <Text style={[styles.suggestionCount, { color: mutedTextColor }]}>
              {item.count.toLocaleString()} posts
            </Text>
          )}
        </View>
        {item.type === 'trending' && (
          <Ionicons name="flame-outline" size={16} color={textColor} style={styles.trendingIcon} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
      onPress={() => onRecentSearchPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionIcon}>🕒</Text>
        <Text style={[styles.suggestionText, { color: textColor }]}>
          {item}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: borderColor }]}
      onPress={() => onSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <Ionicons name="trending-up-outline" size={16} color={textColor} style={styles.suggestionIcon} />
        <View style={styles.suggestionTextContainer}>
          <Text style={[styles.suggestionText, { color: textColor }]}>
            {item.text}
          </Text>
          {item.count && (
            <Text style={[styles.suggestionCount, { color: mutedTextColor }]}>
              {item.count.toLocaleString()} posts
            </Text>
          )}
        </View>
        <Ionicons name="flame-outline" size={16} color={textColor} style={styles.trendingIcon} />
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode, showClearButton = false) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {title}
        </Text>
        {showClearButton && (
          <TouchableOpacity onPress={onClearRecent}>
            <Text style={[styles.clearButton, { color: mutedTextColor }]}>
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );

  const handleScrollBeginDrag = () => {
    // Dismiss keyboard when user starts scrolling
    Keyboard.dismiss();
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: cardColor }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      onScrollBeginDrag={handleScrollBeginDrag}
    >
      {/* Search Suggestions */}
      {limitedSuggestions.length > 0 && (
        renderSection(
          'Suggestions',
          (
            <>
              {limitedSuggestions.map((item, index) => (
                <View key={item.id}>
                  {renderSuggestionItem({ item })}
                </View>
              ))}
            </>
          )
        )
      )}

      {/* Recent Searches */}
      {showRecent && limitedRecentSearches.length > 0 && (
        renderSection(
          'Recent',
          (
            <>
              {limitedRecentSearches.map((item, index) => (
                <View key={`recent-${index}`}>
                  {renderRecentItem({ item })}
                </View>
              ))}
            </>
          ),
          true
        )
      )}

      {/* Trending Searches */}
      {showTrending && limitedTrendingSearches.length > 0 && (
        renderSection(
          'Trending Searches',
          (
            <>
              {limitedTrendingSearches.map((item, index) => (
                <View key={item.id}>
                  {renderTrendingItem({ item })}
                </View>
              ))}
            </>
          )
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    lineHeight: 20,
  },
  suggestionCount: {
    fontSize: 12,
    marginTop: 2,
  },
  trendingIcon: {
    marginLeft: 8,
  },
  trendingText: {
    fontSize: 12,
    color: 'white',
  },
});
