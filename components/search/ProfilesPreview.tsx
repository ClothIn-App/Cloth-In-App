import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { UserSearchResult } from '../../src/types/search';

type Props = {
  users: UserSearchResult[];
  onSeeAll: () => void;
};

export default function ProfilesPreview({ users, onSeeAll }: Props) {
  const previewUsers = users.slice(0, 5);

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: '/user-profile',
      params: { userId },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Profiles</Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>
            {users.length > previewUsers.length ? 'See all' : 'Expand'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#666A70" />
        </TouchableOpacity>
      </View>

      {previewUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No profiles found</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {previewUsers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userItem}
              onPress={() => handleUserPress(user.uid)}
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
                  <Text style={styles.bio} numberOfLines={1}>
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
                  user.isFollowing && styles.followingButton,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  // TODO: Implement follow/unfollow
                  console.log('Toggle follow:', user.uid);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    user.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
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
    gap: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666A70',
  },
});

