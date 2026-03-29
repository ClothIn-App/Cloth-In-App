/**
 * HashtagsPreview component
 * Displays hashtag search results in a list format
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { HashtagSearchResult } from '../../src/types/search';
import { recordSearchEvent } from '../../src/services/apiClients/analyticsClient';

type Props = {
  hashtags: HashtagSearchResult[];
  onSeeAll: () => void;
};

export default function HashtagsPreview({ hashtags, onSeeAll }: Props) {
  // Filter out invalid hashtags before processing
  const validHashtags = (hashtags || []).filter(
    (hashtag) => hashtag && hashtag.tag && typeof hashtag.postCount === 'number'
  );
  const previewHashtags = validHashtags.slice(0, 5);

  const handleHashtagPress = (tag: string) => {
    recordSearchEvent(`#${tag}`, "search_result_click", {
      resultType: "hashtag",
      resultId: tag,
    });
    router.push({
      pathname: '/search-results',
      params: { q: `#${tag}`, category: 'hashtags' },
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Hashtags</Text>
        {validHashtags.length > previewHashtags.length && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={16} color="#666A70" />
          </TouchableOpacity>
        )}
      </View>

      {previewHashtags.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hashtags found</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {previewHashtags.map((hashtag) => {
            const trendIcon = getTrendIcon(hashtag.trendDirection);
            
            return (
              <TouchableOpacity
                key={hashtag.tag}
                style={styles.hashtagItem}
                onPress={() => handleHashtagPress(hashtag.tag)}
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
                        size={14}
                        color={trendIcon.color}
                        style={styles.trendIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.postCount}>
                    {(hashtag.postCount ?? 0).toLocaleString()} posts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666A70" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#666A70',
    fontWeight: '500',
  },
  list: {
    gap: 8,
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F7F7F8',
    borderRadius: 8,
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
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666A70',
  },
});

