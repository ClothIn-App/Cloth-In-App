import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FitPicCommentItem from './fitpic-comment-item';
import FitPicCommentOptionsMenu from './fitpic-comment-options-menu';
import FitPicCommentInput from './fitpic-comment-input';
import type { CommentType } from '../../../src/types/feed';

interface FitPicCommentsSectionProps {
  comments: CommentType[];
  onReplyPress?: (comment: CommentType) => void;
  onCommentUpdate?: (comments: CommentType[]) => void;
  /** When provided, top-level comments are submitted via API; called with (text, parentCommentId?) returns created comment or null */
  onSubmitComment?: (text: string, parentCommentId?: string) => Promise<CommentType | null>;
  /** When provided, comment like/dislike is synced to API; called with (commentId, reaction) */
  onCommentReact?: (commentId: string, reaction: 'like' | 'dislike') => Promise<void>;
}

// Recursive helper to update a comment by id
const updateCommentById = (
  comments: CommentType[],
  id: string,
  updater: (c: CommentType) => CommentType
): CommentType[] => {
  return comments.map((comment) => {
    if (comment.id === id) {
      return updater(comment);
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentById(comment.replies, id, updater),
      };
    }
    return comment;
  });
};

export default function FitPicCommentsSection({
  comments,
  onReplyPress: externalOnReplyPress,
  onCommentUpdate,
  onSubmitComment,
  onCommentReact,
}: FitPicCommentsSectionProps) {
  // Store comments in local state
  const [localComments, setLocalComments] = useState<CommentType[]>(comments);
  const [menuTarget, setMenuTarget] = useState<CommentType | null>(null);

  // Sync local comments when prop changes
  React.useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  // Notify parent when comments change
  React.useEffect(() => {
    if (onCommentUpdate) {
      onCommentUpdate(localComments);
    }
  }, [localComments, onCommentUpdate]);

  // Helper to compute score
  const getScore = (c: CommentType) => (c.likes ?? 0) - (c.dislikes ?? 0);

  // Sort top-level comments by score (highest first), then by createdAt (newest first) if tied
  const sortedComments = useMemo(() => {
    return [...localComments].sort((a, b) => {
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA; // Higher score first
      }
      
      // If scores tie, break by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [localComments]);

  // Handle reactions (like/dislike): optimistic update, then sync to API when onCommentReact provided
  const handleReact = async (commentId: string, type: 'LIKE' | 'DISLIKE') => {
    const reaction = type === 'LIKE' ? 'like' : 'dislike';
    setLocalComments((prev) =>
      updateCommentById(prev, commentId, (c) => {
        let likes = c.likes ?? 0;
        let dislikes = c.dislikes ?? 0;
        if (type === 'LIKE') likes += 1;
        else dislikes += 1;
        return { ...c, likes, dislikes, userReaction: reaction };
      })
    );
    if (onCommentReact) {
      try {
        await onCommentReact(commentId, reaction);
      } catch (e) {
        console.warn('Comment react failed:', e);
      }
    }
  };

  // Handle reply press
  const handleReplyPress = (comment: CommentType) => {
    if (externalOnReplyPress) {
      externalOnReplyPress(comment);
    }
  };

  // Handle menu open
  const handleOpenMenu = (comment: CommentType) => {
    setMenuTarget(comment);
  };

  // Handle menu close
  const handleCloseMenu = () => {
    setMenuTarget(null);
  };

  // Handle menu actions
  const handleReport = (comment: CommentType) => {
    console.log('Report comment', comment.id);
    // TODO: Implement report functionality
  };

  const handleGoToUser = (comment: CommentType) => {
    console.log('Go to user', comment.user);
    // TODO: Implement navigation to user profile
  };

  const handleShare = (comment: CommentType) => {
    console.log('Share comment', comment.id);
    // TODO: Implement share functionality
  };


  // Handle top-level comment submission: use API when onSubmitComment provided
  const handleTopLevelCommentSubmit = async (text: string) => {
    if (onSubmitComment) {
      const newComment = await onSubmitComment(text);
      if (newComment) {
        setLocalComments((prev) => [...prev, newComment]);
      }
      return;
    }
    const newComment: CommentType = {
      id: `c${Date.now()}`,
      user: 'current_user',
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
    };
    setLocalComments((prev) => [...prev, newComment]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Comments{localComments.length > 0 ? ` · ${localComments.length}` : ''}
        </Text>
      </View>

      {/* Top-level comment input */}
      <FitPicCommentInput
        replyingTo={null}
        onSubmit={handleTopLevelCommentSubmit}
      />

      {/* Comments List or Empty State */}
      {localComments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Be the first to comment</Text>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {sortedComments.map((comment) => (
            <FitPicCommentItem
              key={comment.id}
              comment={comment}
              onReplyPress={handleReplyPress}
              onOpenMenu={handleOpenMenu}
              onReact={handleReact}
            />
          ))}
        </View>
      )}

      {/* Options Menu */}
      <FitPicCommentOptionsMenu
        visible={menuTarget !== null}
        comment={menuTarget}
        onClose={handleCloseMenu}
        onReport={handleReport}
        onGoToUser={handleGoToUser}
        onShare={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  commentsList: {
    marginBottom: 12,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

// Export helper function for adding comments
export const addCommentToSection = (
  comments: CommentType[],
  newComment: CommentType,
  replyingTo?: { id: string; user: string } | null
): CommentType[] => {
  if (replyingTo) {
    return updateCommentById(comments, replyingTo.id, (c) => ({
      ...c,
      replies: [...(c.replies || []), newComment],
    }));
  } else {
    return [...comments, newComment];
  }
};