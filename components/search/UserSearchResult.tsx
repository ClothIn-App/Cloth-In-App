import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { UserSearchResult as UserSearchResultType } from '@/src/types/search';

interface UserSearchResultProps {
  user: UserSearchResultType;
  onPress?: (user: UserSearchResultType) => void;
  onFollow?: (userId: string) => void;
}

export default function UserSearchResult({ user, onPress, onFollow }: UserSearchResultProps) {
  // Light theme colors to match the rest of the app
  const textColor = '#11181C';
  const mutedTextColor = '#666A70';
  const cardColor = '#F7F7F8';
  const borderColor = '#E3E3E7';

  const handlePress = () => {
    onPress?.(user);
  };

  const handleFollow = () => {
    onFollow?.(user.uid);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor, borderColor }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: borderColor }]}>
              <Text style={styles.avatarText}>
                {user.displayName?.[0] || user.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          {user.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: '#1DA1F2' }]}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: textColor }]} numberOfLines={1}>
              {user.displayName || user.username}
            </Text>
            <Text style={[styles.username, { color: mutedTextColor }]}>
              @{user.username}
            </Text>
          </View>
          
          {user.bio && (
            <Text style={[styles.bio, { color: mutedTextColor }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          
          {user.followerCount && (
            <Text style={[styles.followerCount, { color: mutedTextColor }]}>
              {user.followerCount.toLocaleString()} followers
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.followButton,
            { 
              backgroundColor: user.isFollowing ? borderColor : textColor,
              borderColor: textColor,
            }
          ]}
          onPress={handleFollow}
        >
          <Text 
            style={[
              styles.followButtonText,
              { color: user.isFollowing ? textColor : cardColor }
            ]}
          >
            {user.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  followerCount: {
    fontSize: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
