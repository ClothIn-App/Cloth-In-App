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
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useProductData } from "@/src/hooks/useProductData";
import { useProductEngagement } from "@/src/hooks/useProductEngagement";
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
import { getCurrentUser } from "@/src/services/mockSessionUsers";
import { analyticsClient } from "@/src/services/apiClients/analyticsClient";
import { stashProductForEdit } from "@/src/utils/productEditHandoff";
import { consumePendingEditSubmissionThankYou } from "@/src/utils/pendingEditSubmissionToast";

const DEFAULT_REACTIONS: Reactions = { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } };

export default function ProductDetailModal() {
  const { id, source } = useLocalSearchParams<{ id?: string; source?: string }>();
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

  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [replyTarget, setReplyTarget] = useState<CommentType | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const hasTextSections = useMemo(() => {
    if (!product) return false;
    return (
      (product.specs != null && product.specs.trim().length > 0) ||
      (product.description != null && product.description.trim().length > 0)
    );
  }, [product]);

  const {
    reactions,
    setReactions,
    isSaved,
    setIsSaved,
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

  // Sync save state from current user (mock mode)
  useEffect(() => {
    if (!product || !currentUser) return;
    const saved = currentUser.saved || [];
    const isProductSaved = saved.some(
      (item: { id: string; type: string }) =>
        item.id === product.id && item.type === "product"
    );
    setIsSaved(isProductSaved);
  }, [product, currentUser, setIsSaved]);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const viewFired = useRef(false);
  useEffect(() => {
    if (product && id && !viewFired.current) {
      viewFired.current = true;
      analyticsClient.recordProductView(id, source ?? "unknown");
    }
  }, [product, id, source]);

  useFocusEffect(
    useCallback(() => {
      if (consumePendingEditSubmissionThankYou()) {
        Alert.alert(
          "Submitted",
          "Thank you! Your edit has been submitted for review.",
          [{ text: "OK" }]
        );
      }
    }, [])
  );

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleEditProduct = useCallback(() => {
    if (!product) return;
    stashProductForEdit(product);
    router.push({ pathname: "/product-edit", params: { id: product.id } });
  }, [product]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleReplySubmit = useCallback(
    async (text: string, replyingTo?: { id: string; user: string } | null) => {
      if (!replyTarget || !replyingTo || !id) return;
      const newReply = await handleSubmitComment(text, replyTarget.id);
      if (newReply) {
        setComments(addReplyToCommentTree(comments, replyTarget.id, newReply));
      }
      setReplyTarget(null);
    },
    [id, replyTarget, comments, handleSubmitComment, addReplyToCommentTree]
  );

  const handleReplyPress = useCallback((comment: CommentType) => {
    setReplyTarget(comment);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProductHeader
        brandName={product?.brand ?? ""}
        productName={product?.name ?? ""}
        onClose={handleClose}
        onEditProduct={handleEditProduct}
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
                color={product.color}
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

