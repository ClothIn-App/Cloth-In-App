import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useProductData } from "@/src/hooks/useProductData";
import { useProductEngagement } from "@/src/hooks/useProductEngagement";
import useAccountData from "@/src/hooks/useAccountData";
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
import { analyticsClient } from "@/src/services/apiClients/analyticsClient";

const DEFAULT_REACTIONS: Reactions = { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } };

export default function ClosetProductDetailModal() {
  const { id, userId, source } = useLocalSearchParams<{ id?: string; userId?: string; source?: string }>();
  const { product, featuredFitPics, comments: initialComments, userFitPics } = useProductData(id, userId);
  const { data } = useAccountData(userId);
  const insets = useSafeAreaInsets();
  const hasTextSections =
    !!product?.specs?.trim() || !!product?.description?.trim();

  const userName = (data.me as any)?.username || "User";

  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [replyTarget, setReplyTarget] = useState<CommentType | null>(null);

  const {
    reactions,
    setReactions,
    isSaved,
    handleReactionPress,
    handleToggleSave,
    handleSubmitComment,
    handleCommentReact,
    addReplyToCommentTree,
  } = useProductEngagement(id);

  // Sync reactions from loaded product
  useEffect(() => {
    if (product) {
      const productReactions = (product as any).reactions as Reactions | undefined;
      setReactions(productReactions ?? DEFAULT_REACTIONS);
    }
  }, [product, setReactions]);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const viewFired = useRef(false);
  useEffect(() => {
    if (product && id && !viewFired.current) {
      viewFired.current = true;
      analyticsClient.recordProductView(id, source ?? "closet");
    }
  }, [product, id, source]);

  if (!product) {
    return null;
  }

  const handleClose = () => {
    router.back();
  };

  const handleAddToWishlist = () => {
    console.log("Add to wishlist:", product.id);
  };

  const handleReplySubmit = async (text: string, replyingTo?: { id: string; user: string } | null) => {
    if (!replyTarget || !replyingTo || !id) return;
    const newReply = await handleSubmitComment(text, replyTarget.id);
    if (newReply) {
      setComments(addReplyToCommentTree(comments, replyTarget.id, newReply));
    }
    setReplyTarget(null);
  };

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
            color={product.color}
            price={product.price}
            productUrl={product.productUrl}
          />
          <View style={styles.reactionsWrapper}>
            <ProductReactionsRow
              reactions={reactions}
              onChange={(newReactions) => setReactions(newReactions)}
              productId={product.id}
              isSaved={isSaved}
              onToggleSave={handleToggleSave}
              onReactionPress={handleReactionPress}
            />
          </View>
          {hasTextSections && (
            <ProductDescription
              description={product.description}
              specs={product.specs}
            />
          )}
          {!hasTextSections && <View style={styles.afterReactionsSpacer} />}
          {userFitPics && userFitPics.length > 0 && (
            <ProductUserStyleCarousel fitpics={userFitPics} userName={userName} />
          )}
          <ProductFitPicCarousel fitpics={featuredFitPics} />

          <ProductCommentsSection
            comments={comments}
            onReplyPress={handleReplyPress}
            onCommentUpdate={setComments}
            onSubmitComment={handleSubmitComment}
            onCommentReact={handleCommentReact}
          />
        </ScrollView>

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
  afterReactionsSpacer: {
    height: 12,
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
