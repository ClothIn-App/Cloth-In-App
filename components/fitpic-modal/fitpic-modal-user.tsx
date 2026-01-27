import React from 'react';
import { View, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';
import mockUsers from '../../src/mocks/mock-users.json';

type AuthorInfo = {
  uid: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

type Props = {
  author: string | AuthorInfo;
  createdAt?: string;
  location?: string;
};

// Helper to look up user by ID from mock data
const getUserById = (userId: string): { username: string; avatarUrl?: string; id?: string } | null => {
  const user = (mockUsers as Record<string, { username: string; avatarUrl?: string; id?: string }>)[userId];
  return user || null;
};

// Helper to find userId by username
const getUserIdByUsername = (username: string): string | null => {
  const users = mockUsers as Record<string, any>;
  for (const [id, user] of Object.entries(users)) {
    if (user.username === username) {
      return id;
    }
  }
  return null;
};

export default function FitPicModalUser({ author, createdAt, location }: Props) {
  const muted = useThemeColor({}, 'mutedText') || '#999';

  // Normalize author data - handle both string (authorId) and object formats
  let username: string;
  let avatarUrl: string | undefined;
  let userId: string | null = null;

  if (typeof author === 'string') {
    // author is an authorId (e.g., "u_1") - look up user data
    const userData = getUserById(author);
    username = userData?.username ?? author;
    avatarUrl = userData?.avatarUrl;
    userId = author; // Use the author string as userId if it's an ID
  } else {
    // author is already an AuthorInfo object
    username = author.username;
    avatarUrl = author.avatarUrl;
    userId = author.uid;
  }

  const handlePress = () => {
    if (userId) {
      router.push({
        pathname: '/user-profile',
        params: { userId },
      });
    } else {
      // Fallback: try to find userId by username
      const foundUserId = getUserIdByUsername(username);
      if (foundUserId) {
        router.push({
          pathname: '/user-profile',
          params: { userId: foundUserId },
        });
      }
    }
  };

  // Format date helper: "2024-01-13T10:30:00Z" -> "Jan 13"
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day}`;
    } catch (error) {
      return '';
    }
  };

  // Check if we have metadata to display
  const hasDate = !!createdAt;
  const hasLocation = !!location;
  const hasMetadata = hasDate || hasLocation;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            avatarUrl
              ? { uri: avatarUrl }
              : require('../../assets/images/icon.png') // Placeholder
          }
          style={styles.avatar}
          defaultSource={require('../../assets/images/icon.png')}
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{username}</Text>
        {hasMetadata && (
          <View style={styles.metadataContainer}>
            {hasDate && (
              <Text style={[styles.metaText, { color: muted }]}>
                {formatDate(createdAt!)}
              </Text>
            )}
            {hasDate && hasLocation && (
              <Text style={[styles.metaText, { color: muted, marginHorizontal: 4 }]}>
                ·
              </Text>
            )}
            {hasLocation && (
              <View style={styles.locationContainer}>
                <Ionicons name="pin-sharp" size={12} color={muted} style={styles.pinIcon} />
                <Text style={[styles.metaText, { color: muted }]}>
                  {location}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
  },
  metaText: {
    fontSize: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 3,
  },
});

