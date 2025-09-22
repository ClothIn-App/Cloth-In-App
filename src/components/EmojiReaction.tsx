/**
 * EmojiReaction Component
 * Displays emoji reactions with counts
 * Allows users to add/remove reactions
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { EmojiReaction as EmojiReactionType } from '../types/fitpic';

type Props = {
  reaction: EmojiReactionType;
  isSelected?: boolean;
  onPress?: (emoji: string) => void;
  style?: any;
};

export default function EmojiReaction({ reaction, isSelected, onPress, style }: Props) {
  const handlePress = () => {
    onPress?.(reaction.emoji);
  };

  return (
    <Pressable
      style={[
        styles.container,
        isSelected && styles.selected,
        style
      ]}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Text style={styles.emoji}>{reaction.emoji}</Text>
      <Text style={[styles.count, isSelected && styles.selectedText]}>
        {reaction.count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#3b82f6',
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedText: {
    color: '#ffffff',
  },
});
