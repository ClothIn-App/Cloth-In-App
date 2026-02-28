import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, ActionSheetIOS, Alert, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFitPicById } from '../src/utils/getFeedItem';
import type { FitPicItem, Reactions, CommentType, ReactionKey } from '../src/types/feed';
import FitPicModalUser from '../components/fitpic-modal/fitpic-modal-user';
import FitPicModalMedia from '../components/fitpic-modal/fitpic-modal-media';
import FitPicModalCaption from '../components/fitpic-modal/fitpic-modal-caption';
import MockFitPicReactionBar from '../components/fitpic-modal/fitpic-modal-reactionbar';
import FitPicFeaturedProductsSection from '../components/fitpic-modal/fitpic-featured-products-section';
import FitPicCommentsSection from '../components/fitpic-modal/comments/fitpic-comments-section';
import FitPicCommentInput from '../components/fitpic-modal/comments/fitpic-comment-input';
import { getCurrentUser } from '../src/services/mockSessionUsers';
import { fitpicClient } from '../src/services/apiClients/fitpicClient';

export default function FitPicDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const insets = useSafeAreaInsets();
  const [fitpic, setFitpic] = useState<FitPicItem | null>(null);
  const [reactions, setReactions] = useState<Reactions | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyTarget, setReplyTarget] = useState<CommentType | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get current user and check if FitPic is saved
  const currentUser = useMemo(
    () => getCurrentUser(),
    []
  );

  // Set isSaved: from API (fitpic.isSaved) when present, else from mock currentUser.saved
  useEffect(() => {
    if (!fitpic) return;
    if (typeof fitpic.isSaved === 'boolean') {
      setIsSaved(fitpic.isSaved);
      return;
    }
    if (!currentUser) return;
    const saved = currentUser.saved || [];
    const isFitPicSaved = saved.some((item: { id: string; type: string }) =>
      item.id === fitpic.id && item.type === "fitpic"
    );
    setIsSaved(isFitPicSaved);
  }, [fitpic, currentUser]);

  const loadFitPic = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const item = await getFitPicById(id);
      if (item) {
        setFitpic(item);
        setReactions(item.reactions);
        setComments(item.comments || []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFitPic();
  }, [loadFitPic]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFitPic();
    } finally {
      setRefreshing(false);
    }
  }, [loadFitPic]);

  // Calculate aspect ratio from fitpic dimensions if available
  const aspectRatio = fitpic?.width && fitpic?.height
    ? fitpic.height / fitpic.width
    : undefined;

  // Extract username from author (FitPicItem.author is always a string)
  const username = fitpic?.author;

  // Helper function to add reply to nested comment tree
  const addReplyToCommentTree = (
    comments: CommentType[],
    targetCommentId: string,
    newReply: CommentType
  ): CommentType[] => {
    return comments.map((comment) => {
      if (comment.id === targetCommentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToCommentTree(comment.replies, targetCommentId, newReply),
        };
      }
      return comment;
    });
  };

  // Submit comment via API and return normalized CommentType (or null on error)
  const handleSubmitComment = useCallback(
    async (text: string, parentCommentId?: string): Promise<CommentType | null> => {
      if (!id) return null;
      try {
        const res = await fitpicClient.addComment(id, {
          text: text.trim(),
          parentCommentId: parentCommentId || undefined,
        });
        if (!res.success || !res.comment) return null;
        const c = res.comment;
        return {
          id: c.id,
          user: c.user,
          text: c.text,
          createdAt: c.createdAt,
          likes: c.like ?? 0,
          dislikes: c.dislike ?? 0,
          replies: [],
          userReaction: c.userReaction,
        };
      } catch (e) {
        console.warn('Failed to add comment:', e);
        return null;
      }
    },
    [id]
  );

  // Handle reply submission (called when user submits from the pinned reply input)
  const handleReplySubmit = useCallback(
    async (text: string, replyingTo?: { id: string; user: string } | null) => {
      if (!replyTarget || !replyingTo || !id) return;
      const newReply = await handleSubmitComment(text, replyTarget.id);
      if (newReply) {
        const updatedComments = addReplyToCommentTree(comments, replyTarget.id, newReply);
        setComments(updatedComments);
      }
      setReplyTarget(null);
    },
    [id, replyTarget, comments, handleSubmitComment]
  );

  // Handle reaction bar press: sync to API (react/unreact)
  const handleReactionPress = useCallback(
    async (key: ReactionKey, isAdding: boolean) => {
      if (!id) return;
      try {
        const res = await fitpicClient.updateEngagement({
          fitpicId: id,
          action: isAdding ? 'react' : 'unreact',
          reaction: key,
        });
        if (res.success && res.engagement) {
          setReactions({
            counts: {
              LIKE: res.engagement.heart ?? 0,
              THUMBS_UP: res.engagement.likes ?? 0,
              FIRE: res.engagement.fire ?? 0,
              DISLIKE: res.engagement.dislikes ?? 0,
            },
          });
          if (fitpic) {
            setFitpic({ ...fitpic, userReaction: res.engagement.userReaction ?? undefined });
          }
        }
      } catch (e) {
        console.warn('Failed to update reaction:', e);
      }
    },
    [id, fitpic]
  );

  // Comment like/dislike via API
  const handleCommentReact = useCallback(
    async (commentId: string, reaction: 'like' | 'dislike') => {
      if (!id) return;
      await fitpicClient.commentReact(id, { commentId, reaction });
      // Optionally refetch or update from response; for now API call is enough (optimistic update already in section)
    },
    [id]
  );

  // Handle reply press
  const handleReplyPress = (comment: CommentType) => {
    setReplyTarget(comment);
  };

  // Handle save toggle: call API then update local state from response
  const handleToggleSave = useCallback(
    async (nextSaved: boolean) => {
      if (!id) return;
      try {
        const res = await fitpicClient.updateEngagement({
          fitpicId: id,
          action: nextSaved ? 'save' : 'unsave',
        });
        if (res.success && res.engagement) {
          setIsSaved(res.engagement.isSaved ?? nextSaved);
        } else {
          setIsSaved(nextSaved);
        }
      } catch (e) {
        console.warn('Failed to update save:', e);
        setIsSaved(nextSaved);
      }
      // Keep mock user saved list in sync when using mock
      if (currentUser && fitpic) {
        if (!currentUser.saved) currentUser.saved = [];
        const saved = currentUser.saved;
        if (nextSaved && !saved.some((item: { id: string; type: string }) => item.id === fitpic.id && item.type === 'fitpic')) {
          saved.unshift({ id: fitpic.id, type: 'fitpic' });
        } else if (!nextSaved) {
          const idx = saved.findIndex((item: { id: string; type: string }) => item.id === fitpic.id && item.type === 'fitpic');
          if (idx !== -1) saved.splice(idx, 1);
        }
      }
    },
    [id, currentUser, fitpic]
  );

  // Handle more options action sheet
  const openMoreOptions = () => {
    const username = fitpic?.author ?? "user";

    if (Platform.OS === "android") {
      Alert.alert(
        "More Options",
        "",
        [
          { text: `Follow @${username}`, onPress: () => {
            // TODO: Follow user
          } },
          { text: "Save Post", onPress: () => {
            // TODO: Save post
          } },
          { text: "Report", style: "destructive", onPress: () => {
            // TODO: Report post
          } },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    // iOS ActionSheet
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", `Follow @${username}`, "Save Post", "Report"],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 0,
        userInterfaceStyle: "light"
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          // TODO: Follow user
        } else if (buttonIndex === 2) {
          // TODO: Save post
        } else if (buttonIndex === 3) {
          // TODO: Report post
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header - Fixed */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={openMoreOptions} 
          style={styles.moreButton}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Keyboard Avoiding View with Scrollable Content */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {id && !fitpic && loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}
        {id && !fitpic && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Couldn't load this post</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadFitPic} activeOpacity={0.7}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {fitpic && (
          <>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#000"
                  colors={['#000']}
                />
              }
            >
              <FitPicModalUser
                author={fitpic.author}
                authorId={fitpic.authorId}
                createdAt={fitpic.createdAt}
                location={fitpic.location}
              />

              <FitPicModalMedia
                imageUrls={fitpic.sources?.length ? fitpic.sources : undefined}
                imageUrl={fitpic.sources?.length ? undefined : fitpic.source}
                aspectRatio={aspectRatio}
                borderRadius={0}
              />

              {reactions && (
                <MockFitPicReactionBar
                  reactions={reactions}
                  onChange={(newReactions) => setReactions(newReactions)}
                  initialSelected={(fitpic.userReaction as ReactionKey) ?? null}
                  isSaved={isSaved}
                  onToggleSave={handleToggleSave}
                  onReactionPress={handleReactionPress}
                />
              )}

              <FitPicModalCaption
                caption={fitpic.caption}
                username={username}
              />

              <FitPicFeaturedProductsSection
                featuredProductIds={fitpic.featuredProducts?.productIds}
                onOpenProduct={(productId) => {
                  router.push({
                    pathname: '/product-detail',
                    params: { id: productId },
                  });
                }}
              />

              <FitPicCommentsSection
                comments={comments}
                onReplyPress={handleReplyPress}
                onCommentUpdate={setComments}
                onSubmitComment={handleSubmitComment}
                onCommentReact={handleCommentReact}
              />
            </ScrollView>

            {replyTarget && (
              <View style={[styles.pinnedInputContainer, { paddingBottom: insets.bottom }]}>
                <FitPicCommentInput
                  replyingTo={{ id: replyTarget.id, user: replyTarget.user }}
                  onSubmit={handleReplySubmit}
                  onCancel={() => setReplyTarget(null)}
                />
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  backButton: {
    padding: 4,
  },
  moreButton: {
    padding: 6,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  pinnedInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e6e6e6',
  },
});

