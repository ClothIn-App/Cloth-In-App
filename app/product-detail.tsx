import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useProductData } from "@/src/hooks/useProductData";
import { ProductHeader } from "@/components/product-modal/ProductHeader";
import { ProductMedia } from "@/components/product-modal/ProductMedia";
import { ProductSummary } from "@/components/product-modal/ProductSummary";
import { ProductReactionsRow } from "@/components/product-modal/ProductReactionsRow";
import type { Reactions } from "@/src/types/feed";

const DEFAULT_REACTIONS: Reactions = { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } };

export default function ProductDetailModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { product, featuredFitPics } = useProductData(id);
  
  // Local state for reactions (optimistic updates)
  const [reactions, setReactions] = useState<Reactions>(DEFAULT_REACTIONS);
  
  // Sync reactions state when product loads
  useEffect(() => {
    if (product) {
      const productReactions = (product as any).reactions as Reactions | undefined;
      setReactions(productReactions ?? DEFAULT_REACTIONS);
    }
  }, [product]);

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ProductHeader
        brandName={product.brand}
        productName={product.name}
        onClose={handleClose}
        onAddToWishlist={handleAddToWishlist}
      />

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
        <ProductReactionsRow
          reactions={reactions}
          onChange={(newReactions) => {
            setReactions(newReactions);
            // later: persist to API
          }}
          productId={product.id}
        />
        {/* Later we will add:
            - ProductDescription
            - ProductFitPicCarousel (using featuredFitPics)
            - ProductCommentsSection
        */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

