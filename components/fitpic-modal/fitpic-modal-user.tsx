import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

type AuthorInfo = {
  uid: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

type Props = {
  author: string | AuthorInfo;
};

export default function FitPicModalUser({ author }: Props) {
  const muted = useThemeColor({}, 'mutedText');

  // Normalize author data - handle both string (username) and object formats
  const authorData: AuthorInfo = typeof author === 'string'
    ? {
        uid: '',
        username: author,
        displayName: undefined,
        avatarUrl: undefined,
      }
    : author;

  const username = authorData.username;
  const displayName = authorData.displayName;
  const avatarUrl = authorData.avatarUrl;

  return (
    <View style={styles.container}>
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
        {displayName ? (
          <>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={[styles.username, { color: muted }]}>@{username}</Text>
          </>
        ) : (
          <Text style={styles.username}>@{username}</Text>
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
});

