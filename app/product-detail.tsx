import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useProductData } from "@/src/hooks/useProductData";
import { ProductHeader } from "@/components/product-modal/ProductHeader";
import { ProductMedia } from "@/components/product-modal/ProductMedia";
import { ProductSummary } from "@/components/product-modal/ProductSummary";
import { ProductReactionsRow } from "@/components/product-modal/ProductReactionsRow";
import { ProductDescription } from "@/components/product-modal/ProductDescription";
import { ProductFitPicCarousel } from "@/components/product-modal/ProductFitPicCarousel";
import { ProductUserStyleCarousel } from "@/components/product-modal/ProductUserStyleCarousel";
import ProductCommentsSection from "@/components/product-modal/comments/product-comments-section";
import ProductCommentInput from "@/components/product-modal/comments/product-comment-input";
import type { Reactions, CommentType } from "@/src/types/feed";

const DEFAULT_REACTIONS: Reactions = { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } };

export default function ProductDetailModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { product, featuredFitPics, comments: initialComments, followersFitPics } = useProductData(id);
  const insets = useSafeAreaInsets();
  
  // Local state for reactions (optimistic updates)
  const [reactions, setReactions] = useState<Reactions>(DEFAULT_REACTIONS);
  
  // Local state for comments
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [replyTarget, setReplyTarget] = useState<CommentType | null>(null);
  
  // Sync reactions state when product loads
  useEffect(() => {
    if (product) {
      const productReactions = (product as any).reactions as Reactions | undefined;
      setReactions(productReactions ?? DEFAULT_REACTIONS);
    }
  }, [product]);

  // Sync comments when initialComments change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  if (!product) {
    // For now, a simple fallback is fine. Later we can improve loading states.
    return null;
  }

  const handleClose = () => {
    router.back();
  };

  const handleAddToWishlist = () => {
    // For now, this can just be a placeholder (e.g., console.log).
    // Later we will wire this to real wishlist logic.
    console.log("Add to wishlist:", product.id);
  };

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProductHeader
        brandName={product.brand}
        productName={product.name}
        onClose={handleClose}
        onAddToWishlist={handleAddToWishlist}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ProductMedia images={product.images ?? [product.imagePath]} />
          <ProductSummary
            brandName={product.brand}
            productName={product.name}
            price={product.price}
            productUrl={product.productUrl}
          />
          <View style={styles.reactionsWrapper}>
            <ProductReactionsRow
              reactions={reactions}
              onChange={(newReactions) => {
                setReactions(newReactions);
                // later: persist to API
              }}
              productId={product.id}
            />
          </View>
          <ProductDescription
            description={product.description}
            details={(product as any).details}
          />
          {/* Followers Style Section - Only show if there are FitPics from followers */}
          {followersFitPics && followersFitPics.length > 0 && (
            <ProductUserStyleCarousel fitpics={followersFitPics} userName="Followers" />
          )}
          <ProductFitPicCarousel fitpics={featuredFitPics} />
          
          {/* Comments Section */}
          <ProductCommentsSection
            comments={comments}
            onReplyPress={handleReplyPress}
            onCommentUpdate={setComments}
          />
        </ScrollView>

        {/* Pinned Reply Input - Only shown when replying */}
        {replyTarget && (
          <View style={[styles.pinnedInputContainer, { paddingBottom: insets.bottom }]}>
            <ProductCommentInput
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
    backgroundColor: "white",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  reactionsWrapper: {
    marginTop: -12,
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

