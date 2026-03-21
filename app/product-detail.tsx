import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from "react-native";
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
import type { Reactions, CommentType, ReactionKey } from "@/src/types/feed";
import {
  getCurrentUser,
  mapGetUserResponseToRawUser,
  setRealCurrentUser,
} from "@/src/services/mockSessionUsers";
import { contentApiClient } from "@/src/services/apiClients/contentClient";
import { userApiClient } from "@/src/services/apiClients/userClient";

const DEFAULT_REACTIONS: Reactions = { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } };

export default function ProductDetailModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    product,
    featuredFitPics,
    comments: initialComments,
    followersFitPics,
    loading,
    error,
    refresh,
  } = useProductData(id);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [reactions, setReactions] = useState<Reactions>(DEFAULT_REACTIONS);
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [replyTarget, setReplyTarget] = useState<CommentType | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const hasTextSections = useMemo(() => {
    if (!product) return false;
    return (
      (product.specs != null && product.specs.trim().length > 0) ||
      (product.description != null && product.description.trim().length > 0)
    );
  }, [product]);

  useEffect(() => {
    if (!product || !currentUser) return;
    const saved = currentUser.saved || [];
    const isProductSaved = saved.some(
      (item: { id: string; type: string }) =>
        item.id === product.id && item.type === "product"
    );
    setIsSaved(isProductSaved);
  }, [product, currentUser]);

  useEffect(() => {
    if (product) {
      const productReactions = (product as any).reactions as Reactions | undefined;
      setReactions(productReactions ?? DEFAULT_REACTIONS);
    }
  }, [product]);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleAddToWishlist = useCallback(() => {
    if (product) {
      console.log("Add to wishlist:", product.id);
    }
  }, [product]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleReactionPress = useCallback(
    async (key: ReactionKey, isAdding: boolean) => {
      if (!id) return;
      try {
        const res = await contentApiClient.updateProductEngagement({
          productId: id,
          action: isAdding ? "react" : "unreact",
          reaction: key,
        });
        if (res.success && res.reactions) {
          setReactions({
            counts: {
              LIKE: res.reactions.LIKE ?? 0,
              THUMBS_UP: res.reactions.THUMBS_UP ?? 0,
              FIRE: res.reactions.FIRE ?? 0,
              DISLIKE: res.reactions.DISLIKE ?? 0,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to update reaction:", e);
      }
    },
    [id]
  );

  const handleSubmitComment = useCallback(
    async (
      text: string,
      parentCommentId?: string
    ): Promise<CommentType | null> => {
      if (!id) return null;
      try {
        const res = await contentApiClient.addProductComment(id, {
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
        console.warn("Failed to add comment:", e);
        return null;
      }
    },
    [id]
  );

  const handleCommentReact = useCallback(
    async (commentId: string, reaction: "like" | "dislike") => {
      if (!id) return;
      await contentApiClient.productCommentReact(id, { commentId, reaction });
    },
    [id]
  );

  const addReplyToCommentTree = useCallback(
    (
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
            replies: addReplyToCommentTree(
              comment.replies,
              targetCommentId,
              newReply
            ),
          };
        }
        return comment;
      });
    },
    []
  );

  const handleReplySubmit = useCallback(
    async (text: string, replyingTo?: { id: string; user: string } | null) => {
      if (!replyTarget || !replyingTo || !id) return;
      const newReply = await handleSubmitComment(text, replyTarget.id);
      if (newReply) {
        setComments(
          addReplyToCommentTree(comments, replyTarget.id, newReply)
        );
      }
      setReplyTarget(null);
    },
    [id, replyTarget, comments, handleSubmitComment, addReplyToCommentTree]
  );

  const handleReplyPress = useCallback((comment: CommentType) => {
    setReplyTarget(comment);
  }, []);

  const handleToggleSave = useCallback(
    async (nextSaved: boolean) => {
      const isRealMode = process.env.EXPO_PUBLIC_API_MODE === "real";
      if (isRealMode && product?.id) {
        try {
          const res = await contentApiClient.updateProductEngagement({
            productId: product.id,
            action: nextSaved ? "save" : "unsave",
          });
          if (res.success) {
            setIsSaved(nextSaved);
            const uid = currentUser?.id;
            if (uid) {
              const response = await userApiClient.getUser(uid);
              if (response?.user) {
                setRealCurrentUser(uid, mapGetUserResponseToRawUser(response.user, uid));
              }
            }
          }
        } catch (e) {
          console.warn("Failed to update save:", e);
        }
        return;
      }
      setIsSaved(nextSaved);
      if (currentUser && product) {
        if (!currentUser.saved) currentUser.saved = [];
        const saved = currentUser.saved;
        if (nextSaved) {
          if (
            !saved.some(
              (item: { id: string; type: string }) =>
                item.id === product.id && item.type === "product"
            )
          ) {
            saved.unshift({ id: product.id, type: "product" });
          }
        } else {
          const index = saved.findIndex(
            (item: { id: string; type: string }) =>
              item.id === product.id && item.type === "product"
          );
          if (index !== -1) saved.splice(index, 1);
        }
      }
    },
    [currentUser, product]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProductHeader
        brandName={product?.brand ?? ""}
        productName={product?.name ?? ""}
        onClose={handleClose}
        onAddToWishlist={handleAddToWishlist}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {id && !product && loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        )}

        {id && !product && !loading && error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Couldn't load this product</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refresh}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {product && (
          <>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#000"
                  colors={["#000"]}
                />
              }
            >
              <ProductMedia images={product.images ?? [product.imagePath]} />
              <ProductSummary
                brandName={product.brand}
                productName={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                priceType={product.priceType}
                productUrl={product.productUrl}
              />
              <View style={styles.reactionsWrapper}>
                <ProductReactionsRow
                  reactions={reactions}
                  onChange={(newReactions) => {
                    setReactions(newReactions);
                  }}
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
              {followersFitPics && followersFitPics.length > 0 && (
                <ProductUserStyleCarousel
                  fitpics={followersFitPics}
                  userName="Followers"
                />
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
              <View
                style={[
                  styles.pinnedInputContainer,
                  { paddingBottom: insets.bottom },
                ]}
              >
                <ProductCommentInput
                  replyingTo={{
                    id: replyTarget.id,
                    user: replyTarget.user,
                  }}
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
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  reactionsWrapper: {
    marginTop: -12,
  },
  afterReactionsSpacer: {
    height: 12,
  },
  pinnedInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e6e6e6",
  },
});

