import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface SearchResultsProps {
  results: any;
  category: any;
  isSearching: boolean;
  onRefresh?: () => void;
  onUserPress?: (user: any) => void;
  onUserFollow?: (userId: string) => void;
  onProductPress?: (product: any) => void;
  onProductPurchase?: (product: any) => void;
  onHashtagPress?: (hashtag: any) => void;
  onFitPicPress?: (fitpic: any) => void;
  onFitPicUserPress?: (userId: string) => void;
  onFitPicProductPress?: (productId: string) => void;
}

export default function SearchResults({
  results,
  category,
  isSearching,
  onRefresh,
  onUserPress,
  onUserFollow,
  onProductPress,
  onProductPurchase,
  onHashtagPress,
  onFitPicPress,
  onFitPicUserPress,
  onFitPicProductPress,
}: SearchResultsProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const backgroundColor = '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.placeholderContainer}>
        <Text style={[styles.placeholderText, { color: mutedTextColor }]}>
          Search results will appear here
        </Text>
        <Text style={[styles.placeholderSubtext, { color: mutedTextColor }]}>
          Coming soon...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
