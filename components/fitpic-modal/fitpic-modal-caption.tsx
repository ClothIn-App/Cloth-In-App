import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  caption?: string;
  username?: string;
  maxLines?: number;
};

export default function FitPicModalCaption({
  caption,
  username,
  maxLines = 0,
}: Props) {
  // If no caption, render nothing
  if (!caption || caption.trim().length === 0) {
    return null;
  }

  const hasUsername = username && username.trim().length > 0;

  return (
    <View style={styles.container}>
      <Text
        style={styles.captionText}
        numberOfLines={maxLines > 0 ? maxLines : undefined}
        accessibilityRole="text"
        accessibilityLabel={hasUsername ? `${username} ${caption}` : caption}
      >
        {hasUsername && (
          <Text style={styles.usernameText}>
            {username}
          </Text>
        )}
        {hasUsername && ' '}
        <Text>{caption}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#111',
    flexWrap: 'wrap',
  },
  usernameText: {
    fontWeight: '600',
    color: '#111',
  },
});

