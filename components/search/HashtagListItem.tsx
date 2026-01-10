/**
 * HashtagListItem component
 * Individual hashtag item for search results lists
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { HashtagSearchResult } from '../../src/types/search';

type Props = {
  hashtag: HashtagSearchResult;
};

export default function HashtagListItem({ hashtag }: Props) {
  const handlePress = () => {
    // TODO: Navigate to hashtag detail page when implemented
    // For now, search for the hashtag
    router.push({
      pathname: '/search-results',
      params: { q: `#${hashtag.tag}`, category: 'hashtags' },
    });
  };

  const getTrendIcon = (direction?: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return { name: 'trending-up' as const, color: '#10b981' };
      case 'down':
        return { name: 'trending-down' as const, color: '#ef4444' };
      case 'stable':
        return { name: 'remove' as const, color: '#666A70' };
      default:
        return null;
    }
  };

  const trendIcon = getTrendIcon(hashtag.trendDirection);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.hashtagInfo}>
        <View style={styles.hashtagHeader}>
          <Text style={styles.hashtagTag}>#{hashtag.tag}</Text>
          {hashtag.isTrending && (
            <View style={styles.trendingBadge}>
              <Ionicons name="flame" size={12} color="#ef4444" />
              <Text style={styles.trendingText}>Trending</Text>
            </View>
          )}
          {trendIcon && (
            <Ionicons
              name={trendIcon.name}
              size={16}
              color={trendIcon.color}
              style={styles.trendIcon}
            />
          )}
        </View>
        <Text style={styles.postCount}>
          {hashtag.postCount.toLocaleString()} posts
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666A70" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#FFFFFF',
  },
  hashtagInfo: {
    flex: 1,
    marginRight: 8,
  },
  hashtagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  hashtagTag: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  trendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  trendIcon: {
    marginLeft: 4,
  },
  postCount: {
    fontSize: 14,
    color: '#666A70',
  },
});

