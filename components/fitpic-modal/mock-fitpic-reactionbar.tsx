import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Reactions, ReactionKey } from '../../src/types/feed';

type Props = {
  reactions: Reactions;
  onChange: (reactions: Reactions) => void;
  onShare?: () => void;
};

// Emoji mapping for UI display only
const REACTION_EMOJIS: Record<ReactionKey, string> = {
  LIKE: '❤️',
  THUMBS_UP: '👍',
  FIRE: '🔥',
  DISLIKE: '👎',
};

// Order of reactions to display
const REACTION_ORDER: ReactionKey[] = ['LIKE', 'THUMBS_UP', 'FIRE', 'DISLIKE'];

export default function MockFitPicReactionBar({ reactions, onChange, onShare }: Props) {
  const handleReactionPress = (reactionKey: ReactionKey) => {
    const currentState = reactions.userReacted[reactionKey];
    const currentCount = reactions.counts[reactionKey];

    // Optimistic update: toggle the user's reaction state and update count
    const newReactions: Reactions = {
      counts: {
        ...reactions.counts,
        [reactionKey]: currentState ? currentCount - 1 : currentCount + 1,
      },
      userReacted: {
        ...reactions.userReacted,
        [reactionKey]: !currentState,
      },
    };

    onChange(newReactions);
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      try {
        await Share.share({
          message: 'Check out this FitPic!',
          ...(Platform.OS === 'ios' && { url: 'https://clothin.app' }),
        });
      } catch (error) {
        // Share dialog was dismissed or error occurred
        console.log('Share error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Reactions - Left aligned */}
      <View style={styles.reactionsContainer}>
        {REACTION_ORDER.map((reactionKey) => {
          const count = reactions.counts[reactionKey];
          const isActive = reactions.userReacted[reactionKey];
          const emoji = REACTION_EMOJIS[reactionKey];

          return (
            <TouchableOpacity
              key={reactionKey}
              style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
              onPress={() => handleReactionPress(reactionKey)}
              activeOpacity={0.7}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {count > 0 && (
                <Text style={[styles.reactionCount, isActive && styles.reactionCountActive]}>
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Share button - Right aligned */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        activeOpacity={0.7}
      >
        <Ionicons name="share-outline" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  reactionButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reactionCountActive: {
    color: '#000',
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
  },
});

