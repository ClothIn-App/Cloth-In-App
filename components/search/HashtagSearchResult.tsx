import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HashtagSearchResult as HashtagSearchResultType } from '@/src/types/search';

interface HashtagSearchResultProps {
  hashtag: HashtagSearchResultType;
  onPress?: (hashtag: HashtagSearchResultType) => void;
}

export default function HashtagSearchResult({ hashtag, onPress }: HashtagSearchResultProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';

  const handlePress = () => {
    onPress?.(hashtag);
  };

  const getTrendIcon = () => {
    if (!hashtag.isTrending) return null;
    
    switch (hashtag.trendDirection) {
      case 'up':
        return 'trending-up-outline';
      case 'down':
        return 'trending-down-outline';
      case 'stable':
        return 'remove-outline';
      default:
        return 'flame-outline';
    }
  };

  const formatPostCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.hashtagInfo}>
          <View style={styles.hashtagRow}>
            <Text style={[styles.hashtag, { color: textColor }]}>
              {hashtag.tag}
            </Text>
            {hashtag.isTrending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="flame-outline" size={12} color="white" />
              </View>
            )}
          </View>
          
          <View style={styles.statsRow}>
            <Text style={[styles.postCount, { color: mutedTextColor }]}>
              {formatPostCount(hashtag.postCount)} posts
            </Text>
            
            {hashtag.isTrending && hashtag.trendDirection && (
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={getTrendIcon() as any} 
                  size={14} 
                  color={mutedTextColor} 
                  style={styles.trendIcon}
                />
                <Text style={[styles.trendText, { color: mutedTextColor }]}>
                  {hashtag.trendDirection === 'up' ? 'Rising' : 
                   hashtag.trendDirection === 'down' ? 'Falling' : 'Stable'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={[styles.arrow, { color: mutedTextColor }]}>
            ›
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hashtag: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  trendingBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postCount: {
    fontSize: 14,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  trendText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
});
