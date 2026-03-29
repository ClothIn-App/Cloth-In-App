import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';
import UserAvatar from '../common/UserAvatar';

type AuthorInfo = {
  uid: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

type Props = {
  author: string | AuthorInfo;
  authorId?: string; // Optional authorId for when author is a string (username)
  createdAt?: string;
  location?: string;
};

export default function FitPicModalUser({ author, authorId, createdAt, location }: Props) {
  const router = useRouter();
  const muted = useThemeColor({}, 'mutedText') || '#999';

  // Normalize author data - handle both string (authorId) and object formats
  let username: string;
  let avatarUrl: string | undefined;
  let userId: string | undefined;

  if (typeof author === 'string') {
    // author is an authorId or username string – render as-is
    username = author;
    avatarUrl = undefined;
    // Try to extract userId:
    // 1. If author starts with "u_", it's likely a userId
    // 2. If authorId prop is provided, use that
    // 3. Otherwise, assume author string might be a userId (fallback)
    if (author.startsWith('u_')) {
      userId = author;
    } else if (authorId) {
      userId = authorId;
    } else {
      // If it doesn't look like a userId and no authorId provided, disable navigation
      userId = undefined;
    }
  } else {
    // author is already an AuthorInfo object
    username = author.username;
    avatarUrl = author.avatarUrl;
    userId = author.uid;
  }

  const handleUsernamePress = () => {
    if (userId) {
      router.push({
        pathname: '/user-profile',
        params: { userId },
      });
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
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <UserAvatar
          avatarUrl={avatarUrl}
          size={32}
          onPress={userId ? handleUsernamePress : undefined}
        />
      </View>
      <View style={styles.userInfo}>
        <TouchableOpacity onPress={handleUsernamePress} disabled={!userId} activeOpacity={0.7}>
          <Text style={[styles.username, userId && styles.usernameTappable]}>@{username}</Text>
        </TouchableOpacity>
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
    </View>
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
  usernameTappable: {
    // Visual indication that it's tappable (optional)
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

