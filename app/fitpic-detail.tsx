import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, ActionSheetIOS, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFitPicById } from '../src/utils/getFeedItem';
import type { FitPicItem, Reactions, CommentType } from '../src/types/feed';
import FitPicModalUser from '../components/fitpic-modal/fitpic-modal-user';
import FitPicModalMedia from '../components/fitpic-modal/fitpic-modal-media';
import FitPicModalCaption from '../components/fitpic-modal/fitpic-modal-caption';
import MockFitPicReactionBar from '../components/fitpic-modal/fitpic-modal-reactionbar';
import FitPicFeaturedProductsSection from '../components/fitpic-modal/fitpic-featured-products-section';
import FitPicCommentsSection from '../components/fitpic-modal/comments/fitpic-comments-section';
import FitPicCommentInput from '../components/fitpic-modal/comments/fitpic-comment-input';

export default function FitPicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [fitpic, setFitpic] = useState<FitPicItem | null>(null);
  const [reactions, setReactions] = useState<Reactions | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyTarget, setReplyTarget] = useState<CommentType | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadFitPic = useCallback(async () => {
    if (!id) return;
    
    const item = await getFitPicById(id);
    if (item) {
      setFitpic(item);
      setReactions(item.reactions);
      setComments(item.comments || []);
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

  // Handle reply submission
  const handleReplySubmit = (text: string, replyingTo?: { id: string; user: string } | null) => {
    if (!replyTarget || !replyingTo) return;

    const newReply: CommentType = {
      id: `${replyTarget.id}.${Date.now()}`,
      user: 'current_user', // TODO: Replace with actual current user
      text,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
    };

    const updatedComments = addReplyToCommentTree(comments, replyTarget.id, newReply);
    setComments(updatedComments);
    setReplyTarget(null);
  };

  // Handle reply press
  const handleReplyPress = (comment: CommentType) => {
    setReplyTarget(comment);
  };

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
        {/* Scrollable Content */}
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
          {/* User Information */}
          {fitpic && (
            <FitPicModalUser
              author={fitpic.author}
              createdAt={fitpic.createdAt}
              location={fitpic.location}
            />
          )}

          {/* Media */}
          {fitpic && (
            <FitPicModalMedia
              imageUrl={fitpic.source}
              aspectRatio={aspectRatio}
              borderRadius={0}
            />
          )}

          {/* ReactionBar */}
          {fitpic && reactions && (
            <MockFitPicReactionBar
              reactions={reactions}
              onChange={(newReactions) => {
                setReactions(newReactions);
                // In a real app, you would also call an API to persist the reaction
              }}
            />
          )}

          {/* Caption */}
          {fitpic && (
            <FitPicModalCaption
              caption={fitpic.caption}
              username={username}
            />
          )}

          {/* Featured Products */}
          {fitpic && (
            <FitPicFeaturedProductsSection
              featuredProductIds={fitpic.featuredProductIds}
              onOpenProduct={(productId) => {
                router.push({
                  pathname: '/product-detail',
                  params: { id: productId },
                });
              }}
            />
          )}

          {/* Comments Section */}
          {fitpic && (
            <FitPicCommentsSection
              comments={comments}
              onReplyPress={handleReplyPress}
              onCommentUpdate={setComments}
            />
          )}
        </ScrollView>

        {/* Pinned Reply Input - Only shown when replying */}
        {replyTarget && (
          <View style={[styles.pinnedInputContainer, { paddingBottom: insets.bottom }]}>
            <FitPicCommentInput
              replyingTo={{ id: replyTarget.id, user: replyTarget.user }}
              onSubmit={handleReplySubmit}
              onCancel={() => setReplyTarget(null)}
            />
          </View>
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

