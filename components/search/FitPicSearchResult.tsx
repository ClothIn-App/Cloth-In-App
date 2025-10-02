import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, ScrollView, Text } from 'react-native';
import { FitPicSearchResult as FitPicSearchResultType } from '@/src/types/search';

interface FitPicSearchResultProps {
  fitpic: FitPicSearchResultType;
  onPress?: (fitpic: FitPicSearchResultType) => void;
  onUserPress?: (userId: string) => void;
  onProductPress?: (productId: string) => void;
}

export default function FitPicSearchResult({ 
  fitpic, 
  onPress, 
  onUserPress, 
  onProductPress 
}: FitPicSearchResultProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';

  const handlePress = () => {
    onPress?.(fitpic);
  };

  const handleUserPress = () => {
    onUserPress?.(fitpic.authorId);
  };

  const handleProductPress = (productId: string) => {
    onProductPress?.(productId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatEngagement = (count: number) => {
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
      {/* Header with user info */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
          {fitpic.author.avatarUrl ? (
            <Image source={{ uri: fitpic.author.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: borderColor }]}>
              <Text style={styles.avatarText}>
                {fitpic.author.displayName?.[0] || fitpic.author.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: textColor }]}>
              {fitpic.author.displayName || fitpic.author.username}
            </Text>
            <Text style={[styles.timestamp, { color: mutedTextColor }]}>
              {formatTimeAgo(fitpic.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <View style={styles.photoContainer}>
        {fitpic.photos[0] && (
          <Image 
            source={{ uri: fitpic.photos[0].url }} 
            style={styles.photo}
            resizeMode="cover"
          />
        )}
        {fitpic.photos.length > 1 && (
          <View style={styles.multiplePhotosIndicator}>
            <Text style={styles.multiplePhotosText}>
              +{fitpic.photos.length - 1}
            </Text>
          </View>
        )}
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={[styles.caption, { color: textColor }]}>
          {fitpic.caption}
        </Text>
      </View>

      {/* Products */}
      {fitpic.products.length > 0 && (
        <View style={styles.productsContainer}>
          <Text style={[styles.productsLabel, { color: mutedTextColor }]}>
            Products:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {fitpic.products.map((product, index) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productTag, { borderColor }]}
                onPress={() => handleProductPress(product.id)}
              >
                <Text style={[styles.productTagText, { color: textColor }]}>
                  {product.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Engagement */}
      <View style={styles.engagementContainer}>
        <View style={styles.engagementItem}>
          <Text style={[styles.engagementIcon, { color: mutedTextColor }]}>
            ❤️
          </Text>
          <Text style={[styles.engagementCount, { color: mutedTextColor }]}>
            {formatEngagement(fitpic.engagement.likes)}
          </Text>
        </View>
        
        <View style={styles.engagementItem}>
          <Text style={[styles.engagementIcon, { color: mutedTextColor }]}>
            💾
          </Text>
          <Text style={[styles.engagementCount, { color: mutedTextColor }]}>
            {formatEngagement(fitpic.engagement.saves)}
          </Text>
        </View>
        
        <View style={styles.engagementItem}>
          <Text style={[styles.engagementIcon, { color: mutedTextColor }]}>
            💬
          </Text>
          <Text style={[styles.engagementCount, { color: mutedTextColor }]}>
            {formatEngagement(fitpic.engagement.comments)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 300,
  },
  multiplePhotosIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  multiplePhotosText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  captionContainer: {
    padding: 16,
    paddingTop: 12,
  },
  caption: {
    fontSize: 16,
    lineHeight: 22,
  },
  productsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  productsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  productTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  productTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  engagementContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E3E3E7',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  engagementIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  engagementCount: {
    fontSize: 14,
    fontWeight: '500',
  },
});
