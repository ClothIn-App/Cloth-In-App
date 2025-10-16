/**
 * ProductReactions Component
 * Shows product reactions with emoji picker functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmojiReactionPicker from './EmojiReactionPicker';

type Props = {
  reactions?: { emoji: string; count: number }[];
  userReactions?: string[];
  onReaction?: (emoji: string) => void;
  style?: any;
};

export default function ProductReactions({ 
  reactions = [], 
  userReactions = [], 
  onReaction,
  style 
}: Props) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onReaction?.(emoji);
  };

  const getTotalReactions = () => {
    return reactions.reduce((total, reaction) => total + reaction.count, 0);
  };

  const renderReactionBubble = (reaction: { emoji: string; count: number }, index: number) => {
    const isUserReacted = userReactions.includes(reaction.emoji);
    
    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.reactionBubble,
          isUserReacted && styles.userReactedBubble
        ]}
        onPress={() => handleEmojiSelect(reaction.emoji)}
      >
        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
        <Text style={[
          styles.reactionCount,
          isUserReacted && styles.userReactedText
        ]}>
          {reaction.count}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.reactionsContainer}>
        {reactions.slice(0, 4).map(renderReactionBubble)}
        {reactions.length > 4 && (
          <View style={styles.moreReactions}>
            <Text style={styles.moreText}>+{reactions.length - 4}</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.addReactionButton}
        onPress={() => setShowEmojiPicker(true)}
      >
        <Ionicons name="add" size={16} color="#6B7280" />
      </TouchableOpacity>

      {getTotalReactions() > 0 && (
        <Text style={styles.totalReactions}>
          {getTotalReactions()} reaction{getTotalReactions() !== 1 ? 's' : ''}
        </Text>
      )}

      <EmojiReactionPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  userReactedBubble: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  userReactedText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  moreReactions: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  addReactionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalReactions: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
