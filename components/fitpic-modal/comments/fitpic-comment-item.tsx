import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CommentType } from '../../../src/types/feed';
import { userApiClient } from '../../../src/services/apiClients/userClient';
import ProfileNotFoundModal from '../../common/ProfileNotFoundModal';

// Re-export CommentType for convenience
export type { CommentType };

interface FitPicCommentItemProps {
  comment: CommentType;
  depth?: number;
  onReplyPress: (comment: CommentType) => void;
  onOpenMenu: (comment: CommentType) => void;
  onReact: (commentId: string, type: 'LIKE' | 'DISLIKE') => void;
}

// Color constants matching reaction bar
const LIKE_ACTIVE_COLOR = '#FFD60A'; // emoji yellow (matching THUMBS_UP)
const DISLIKE_ACTIVE_COLOR = '#FFD60A'; // emoji yellow
const INACTIVE_COLOR = '#222';

// Simple timestamp formatter
const formatTimestamp = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    // For older dates, show month/day
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export default function FitPicCommentItem({
  comment,
  depth = 0,
  onReplyPress,
  onOpenMenu,
  onReact,
}: FitPicCommentItemProps) {
  const router = useRouter();
  const [showProfileNotFound, setShowProfileNotFound] = useState(false);
  const [authorTapLoading, setAuthorTapLoading] = useState(false);

  const indent = depth * 16;

  const getUserIdFromUsername = (username: string): string | null => {
    if (username.startsWith('u_')) return username;
    return null;
  };

  const userId = comment.authorId ?? getUserIdFromUsername(comment.user) ?? null;

  const handleAuthorPress = async () => {
    if (!userId || authorTapLoading) return;
    setAuthorTapLoading(true);
    try {
      const res = await userApiClient.getUser(userId);
      if (!res.user) {
        setShowProfileNotFound(true);
        return;
      }
      router.push({
        pathname: '/user-profile',
        params: { userId },
      });
    } finally {
      setAuthorTapLoading(false);
    }
  };

  // Track local reaction state (optimistic UI)
  // TODO: This should be synced with actual user reaction state from parent/API
  const [localLikes, setLocalLikes] = useState(comment.likes);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);

  // Animation values for pop effect
  const likePop = useMemo(() => new Animated.Value(1), []);
  const dislikePop = useMemo(() => new Animated.Value(1), []);

  const animatePop = (animatedValue: Animated.Value) => {
    animatedValue.stopAnimation();
    Animated.sequence([
      Animated.timing(animatedValue, { toValue: 1.15, duration: 110, useNativeDriver: true }),
      Animated.spring(animatedValue, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const handleLike = () => {
    if (hasLiked) {
      setLocalLikes(Math.max(0, localLikes - 1));
      setHasLiked(false);
    } else {
      if (hasDisliked) {
        setLocalDislikes(Math.max(0, localDislikes - 1));
        setHasDisliked(false);
      }
      setLocalLikes(localLikes + 1);
      setHasLiked(true);
    }
    animatePop(likePop);
    onReact(comment.id, 'LIKE');
  };

  const handleDislike = () => {
    if (hasDisliked) {
      setLocalDislikes(Math.max(0, localDislikes - 1));
      setHasDisliked(false);
    } else {
      if (hasLiked) {
        setLocalLikes(Math.max(0, localLikes - 1));
        setHasLiked(false);
      }
      setLocalDislikes(localDislikes + 1);
      setHasDisliked(true);
    }
    animatePop(dislikePop);
    onReact(comment.id, 'DISLIKE');
  };

  return (
    <View style={[styles.container, { marginLeft: indent }]}>
      {/* Avatar and Username Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleAuthorPress}
          disabled={!userId}
          activeOpacity={0.7}
        >
          <Image
            source={
              comment.avatarUrl
                ? { uri: comment.avatarUrl }
                : require('../../../assets/images/icon.png')
            }
            style={styles.avatar}
            defaultSource={require('../../../assets/images/icon.png')}
          />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <TouchableOpacity
            onPress={handleAuthorPress}
            disabled={!userId}
            activeOpacity={0.7}
          >
            <Text style={styles.username}>@{comment.user}</Text>
          </TouchableOpacity>
          <Text style={styles.separator}> · </Text>
          <Text style={styles.timestamp}>{formatTimestamp(comment.createdAt)}</Text>
        </View>
      </View>

      {/* Comment Text */}
      <View style={styles.textContainer}>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {/* Like Button */}
        <TouchableOpacity
          style={[styles.actionButton, hasLiked && styles.actionButtonActive]}
          onPress={handleLike}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: likePop }] }}>
            <Ionicons
              name={hasLiked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={16}
              color={hasLiked ? LIKE_ACTIVE_COLOR : INACTIVE_COLOR}
            />
          </Animated.View>
          {localLikes > 0 && (
            <Text style={[styles.count, hasLiked && { color: LIKE_ACTIVE_COLOR }]}>
              {localLikes}
            </Text>
          )}
        </TouchableOpacity>

        {/* Dislike Button */}
        <TouchableOpacity
          style={[styles.actionButton, hasDisliked && styles.actionButtonActive]}
          onPress={handleDislike}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale: dislikePop }] }}>
            <Ionicons
              name={hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
              size={16}
              color={hasDisliked ? DISLIKE_ACTIVE_COLOR : INACTIVE_COLOR}
            />
          </Animated.View>
          {localDislikes > 0 && (
            <Text style={[styles.count, hasDisliked && { color: DISLIKE_ACTIVE_COLOR }]}>
              {localDislikes}
            </Text>
          )}
        </TouchableOpacity>

        {/* Reply Button */}
        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => onReplyPress(comment)}
          activeOpacity={0.7}
        >
          <Text style={styles.replyText}>Reply</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Ellipsis Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => onOpenMenu(comment)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Recursive Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <FitPicCommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReplyPress={onReplyPress}
              onOpenMenu={onOpenMenu}
              onReact={onReact}
            />
          ))}
        </View>
      )}
      <ProfileNotFoundModal
        visible={showProfileNotFound}
        onClose={() => setShowProfileNotFound(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E5E5',
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  separator: {
    fontSize: 12,
    color: '#999',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  textContainer: {
    marginLeft: 34, // Align with username (avatar width + margin)
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#111',
    flexWrap: 'wrap',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34, // Align with username
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: '#f7f7f7',
  },
  count: {
    marginLeft: 6,
    fontSize: 12,
    color: '#555',
    fontWeight: '600',
  },
  replyButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  repliesContainer: {
    marginTop: 4,
  },
});

