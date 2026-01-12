/**
 * SearchAnalytics component
 * Displays search metadata: result counts, search time, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  totalResults: number;
  searchTime?: number;
  query: string;
  category?: string;
};

export default function SearchAnalytics({ totalResults, searchTime, query, category }: Props) {
  if (totalResults === 0) {
    return null;
  }

  const formatSearchTime = (time?: number): string => {
    if (!time) return '';
    if (time < 1000) {
      return `${time}ms`;
    }
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatResultCount = (count: number): string => {
    if (count >= 1000) {
      return `About ${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
    }
    return count.toString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {totalResults > 0 ? (
          <>
            {formatResultCount(totalResults)} result{totalResults !== 1 ? 's' : ''}
            {searchTime && ` • Found in ${formatSearchTime(searchTime)}`}
          </>
        ) : (
          'No results'
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  text: {
    fontSize: 14,
    color: '#666A70',
  },
});

