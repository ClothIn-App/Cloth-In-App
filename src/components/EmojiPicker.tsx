/**
 * EmojiPicker Component
 * Simple emoji picker for reactions
 * Shows 3 emoji options: thumbs up, heart, party
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native';

type Props = {
  visible: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
};

const EMOJI_OPTIONS = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🎉', label: 'Party' },
];

export default function EmojiPicker({ visible, onEmojiSelect, onClose }: Props) {
  const handleEmojiPress = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Reaction</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((option) => (
              <Pressable
                key={option.emoji}
                style={styles.emojiOption}
                onPress={() => handleEmojiPress(option.emoji)}
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
              >
                <Text style={styles.emoji}>{option.emoji}</Text>
                <Text style={styles.emojiLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  emojiOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    minWidth: 80,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
