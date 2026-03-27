/**
 * UserListItem component
 * Individual user item for search results lists
 */

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { UserSearchResult } from '../../src/types/search';
import { userApiClient } from '../../src/services/apiClients/userClient';

type Props = {
  user: UserSearchResult;
  onPress?: (user: UserSearchResult) => void;
  onFollowPress?: (user: UserSearchResult) => void;
};

export default function UserListItem({ user, onPress, onFollowPress }: Props) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);

  const handlePress = () => {
    if (onPress) {
      onPress(user);
    } else {
      router.push({
        pathname: '/user-profile',
        params: { userId: user.uid },
      });
    }
  };

  const handleFollowPress = async () => {
    if (onFollowPress) {
      onFollowPress(user);
      return;
    }
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    try {
      if (nextFollowing) {
        await userApiClient.followUser(user.uid);
      } else {
        await userApiClient.unfollowUser(user.uid);
      }
    } catch (e) {
      // Revert optimistic update on failure
      setIsFollowing(!nextFollowing);
      console.warn('Failed to update follow:', e);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: user.avatarUrl || 'https://placehold.co/50x50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user.displayName || user.username}
          </Text>
          {user.verified && (
            <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
          )}
        </View>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
        {user.followerCount !== undefined && (
          <Text style={styles.followerCount}>
            {user.followerCount.toLocaleString()} followers
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          isFollowing && styles.followingButton,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          handleFollowPress();
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.followButtonText,
            isFollowing && styles.followingButtonText,
          ]}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  username: {
    fontSize: 14,
    color: '#666A70',
    marginBottom: 2,
  },
  bio: {
    fontSize: 14,
    color: '#11181C',
    marginBottom: 4,
    lineHeight: 18,
  },
  followerCount: {
    fontSize: 12,
    color: '#666A70',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#11181C',
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#11181C',
  },
});
