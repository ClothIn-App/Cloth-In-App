import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";

import { useOtherUserCloset } from "../../src/hooks/useOtherUserCloset";
import { contentApiClient } from "../../src/services/apiClients/contentClient";
import { PRODUCT_ASSETS } from "../../src/maps/images";
import ClosetProductCard from "../account/closet/ClosetProductCard";
import EndlessRackCarousel, {
  type EndlessRackCarouselHandle,
} from "../account/closet/EndlessRackCarousel";
import RackStackTile from "../account/closet/RackStackTile";
import RackDetailModal from "../account/closet/RackDetailModal";

type Product = { id: string };

type Props = {
  userId: string;
  testID?: string;
  onRetry?: () => void;
  initialCloset?: unknown;
};

const getProductsByIds = (productIds: string[]): Product[] => {
  if (!productIds?.length) return [];
  return productIds.map((id) => ({ id }));
};

export default function OtherUserClosetSubtab({
  userId,
  testID,
  onRetry,
  initialCloset,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isFocused = useIsFocused();
  const allProductsCarouselRef = useRef<EndlessRackCarouselHandle | null>(null);

  const {
    closetData,
    loading,
    error,
    refetch,
    showInitialLoader,
    hasServerResult,
  } = useOtherUserCloset(userId, { initialCloset });

  const [rackDetailVisible, setRackDetailVisible] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [allProductsDetailVisible, setAllProductsDetailVisible] = useState(false);
  const [productImageMap, setProductImageMap] = useState<Record<string, ImageSourcePropType>>({});

  const pendingRackIdRef = useRef<string | null>(null);
  const pendingAllProductsRef = useRef(false);

  const allProducts = useMemo(
    () => getProductsByIds(closetData.baseProductIds),
    [closetData.baseProductIds]
  );

  const rackSections = useMemo(() => {
    const sorted = [...closetData.racks].sort((a, b) => {
      const at = a.createdAt ?? 0;
      const bt = b.createdAt ?? 0;
      return at - bt;
    });
    return sorted.map((rack) => ({
      id: rack.id,
      name: rack.name,
      products: getProductsByIds(rack.productIds || []),
    }));
  }, [closetData.racks]);

  const selectedRackForDetail = useMemo(() => {
    if (!selectedRackId) return null;
    return rackSections.find((r) => r.id === selectedRackId) ?? null;
  }, [selectedRackId, rackSections]);

  useEffect(() => {
    if (isFocused) {
      if (pendingRackIdRef.current !== null) {
        const rackIdToRestore = pendingRackIdRef.current;
        pendingRackIdRef.current = null;
        setSelectedRackId(rackIdToRestore);
        setRackDetailVisible(true);
      } else if (pendingAllProductsRef.current) {
        pendingAllProductsRef.current = false;
        setAllProductsDetailVisible(true);
      }
    }
  }, [isFocused]);

  const allClosetProductIds = useMemo(() => {
    const ids = new Set<string>(closetData.baseProductIds);
    closetData.racks.forEach((r) => (r.productIds || []).forEach((id) => ids.add(id)));
    return Array.from(ids);
  }, [closetData.baseProductIds, closetData.racks]);

  useEffect(() => {
    setProductImageMap({});
  }, [userId]);

  useEffect(() => {
    const idsToFetch = allClosetProductIds.filter((id) => !PRODUCT_ASSETS[id]);
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    Promise.allSettled(idsToFetch.map((id) => contentApiClient.getProduct(id))).then((results) => {
      if (cancelled) return;
      const next: Record<string, ImageSourcePropType> = {};
      results.forEach((result, i) => {
        const id = idsToFetch[i];
        if (!id || result.status !== "fulfilled" || !result.value?.product) return;
        const p = result.value.product as {
          primaryImageUrl?: string | null;
          imagePath?: string;
          images?: Array<{ url?: string } | string>;
        };
        const firstImg = Array.isArray(p.images) && p.images[0]
          ? typeof p.images[0] === "object" && p.images[0] && "url" in p.images[0]
            ? (p.images[0] as { url?: string }).url
            : (p.images[0] as string)
          : undefined;
        const imageUrl = p.primaryImageUrl ?? firstImg ?? p.imagePath ?? "";
        if (imageUrl) next[id] = { uri: imageUrl };
      });
      setProductImageMap((prev) => ({ ...prev, ...next }));
    });
    return () => {
      cancelled = true;
    };
  }, [allClosetProductIds]);

  const getProductImageSource = useCallback(
    (productId: string): ImageSourcePropType | undefined =>
      productImageMap[productId] ?? PRODUCT_ASSETS[productId],
    [productImageMap]
  );

  const pauseCarousel = () => {
    allProductsCarouselRef.current?.pauseAutoDrift();
  };

  const resumeCarousel = () => {
    allProductsCarouselRef.current?.resumeAutoDrift();
  };

  const handleRetry = () => {
    void refetch();
    onRetry?.();
  };

  useEffect(() => {
    setRackDetailVisible(false);
    setAllProductsDetailVisible(false);
    setSelectedRackId(null);
    pendingRackIdRef.current = null;
    pendingAllProductsRef.current = false;
  }, [userId]);

  const errorMessage =
    error instanceof Error ? error.message : error != null ? String(error) : "Something went wrong.";

  if (showInitialLoader) {
    return (
      <View style={styles.centered} testID={testID}>
        <ActivityIndicator />
        <Text style={styles.loadingCaption}>Loading Closet…</Text>
      </View>
    );
  }

  if (error && !hasServerResult && initialCloset === undefined) {
    return (
      <View style={[styles.centered, { padding: 16 }]} testID={testID}>
        <Text style={styles.errorTitle}>Error loading closet</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity onPress={handleRetry} accessibilityRole="button" accessibilityLabel="Retry loading closet">
          <Text style={styles.retryLink}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderAllProductsSection = () => {
    const alwaysShow = true;
    const products = allProducts;
    if (!alwaysShow && (!products || products.length === 0)) {
      return null;
    }

    const productsWithImages = products.filter((product) => getProductImageSource(product.id));

    if (!alwaysShow && productsWithImages.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Pressable
              onPress={() => {
                pauseCarousel();
                setAllProductsDetailVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Expand All Products"
              pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
              hitSlop={6}
            >
              <Text style={styles.sectionTitle}>All Products</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                pauseCarousel();
                setAllProductsDetailVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Expand All Products"
              pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
              hitSlop={6}
              style={styles.expandButton}
            >
              <Ionicons name="expand" size={20} color="#11181C" />
            </Pressable>
          </View>
        </View>
        <EndlessRackCarousel
          ref={allProductsCarouselRef}
          products={productsWithImages}
          placeholderText="No products in this closet yet."
          renderItem={(product, width) => {
            const imageSource = getProductImageSource(product.id);
            if (!imageSource) {
              return null;
            }
            return (
              <Pressable
                testID={testID ? `${testID}-all-products-${product.id}` : undefined}
                onPress={() => {
                  pauseCarousel();
                  router.push({
                    pathname: "/closet-product-detail",
                    params: { id: product.id, userId },
                  });
                }}
                style={styles.productCardPressable}
              >
                <ClosetProductCard width={width} source={imageSource} borderRadius={16} />
              </Pressable>
            );
          }}
          autoDriftEnabled={false}
        />
      </View>
    );
  };

  const gridHorizontalPadding = 24;
  const gridColumnGap = 12;
  const tileWidth = (screenWidth - gridHorizontalPadding * 2 - gridColumnGap) / 2;

  const isClosetStructurallyEmpty =
    closetData.baseProductIds.length === 0 && closetData.racks.length === 0;

  const anyResolvedImage = allClosetProductIds.some((id) => getProductImageSource(id));

  const showGlobalEmpty =
    hasServerResult && isClosetStructurallyEmpty && !loading && !anyResolvedImage;

  const refreshControl = (
    <RefreshControl
      refreshing={loading && hasServerResult}
      onRefresh={() => {
        void refetch();
        onRetry?.();
      }}
    />
  );

  return (
    <View style={styles.container} testID={testID}>
      {error && !hasServerResult && initialCloset !== undefined ? (
        <View style={styles.inlineErrorBanner}>
          <Text style={styles.inlineErrorText}>Couldn't refresh closet.</Text>
          <TouchableOpacity onPress={handleRetry}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 16 + insets.bottom }]}
        onTouchStart={pauseCarousel}
        onTouchEnd={resumeCarousel}
        onScrollBeginDrag={pauseCarousel}
        refreshControl={refreshControl}
      >
        {showGlobalEmpty ? (
          <View style={styles.emptyClosetCard}>
            <Text style={styles.emptyClosetTitle}>No products in this closet yet.</Text>
          </View>
        ) : (
          <>
            {renderAllProductsSection()}

            <View style={[styles.racksGrid, { paddingHorizontal: gridHorizontalPadding }]}>
              {rackSections.map((rack, idx) => {
                const items = rack.products
                  .filter((p) => getProductImageSource(p.id))
                  .slice(0, 3)
                  .map((p) => ({
                    id: p.id,
                    source: getProductImageSource(p.id)!,
                  }));

                const isLeftColumn = idx % 2 === 0;
                return (
                  <View
                    key={rack.id}
                    style={[
                      styles.rackTileWrap,
                      {
                        width: tileWidth,
                        marginRight: isLeftColumn ? gridColumnGap : 0,
                      },
                    ]}
                  >
                    <RackStackTile
                      title={rack.name}
                      width={tileWidth}
                      items={items}
                      maxPreviewCount={3}
                      showOptionsButton={false}
                      emptyRackLabel="No products"
                      onPress={() => {
                        pauseCarousel();
                        setSelectedRackId(rack.id);
                        setRackDetailVisible(true);
                      }}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <RackDetailModal
        visible={rackDetailVisible}
        rackName={selectedRackForDetail?.name ?? ""}
        readOnly
        products={
          selectedRackForDetail?.products
            ?.filter((p) => getProductImageSource(p.id))
            .map((p) => ({
              id: p.id,
              source: getProductImageSource(p.id)!,
            })) ?? []
        }
        onClose={() => {
          setRackDetailVisible(false);
          if (pendingRackIdRef.current === null) {
            setSelectedRackId(null);
          }
        }}
        onProductPress={(productId) => {
          pendingRackIdRef.current = selectedRackId;
          router.push({
            pathname: "/closet-product-detail",
            params: { id: productId, userId },
          });
        }}
      />

      <RackDetailModal
        visible={allProductsDetailVisible}
        rackName="All Products"
        readOnly
        products={allProducts
          .filter((p) => getProductImageSource(p.id))
          .map((p) => ({
            id: p.id,
            source: getProductImageSource(p.id)!,
          }))}
        onClose={() => {
          setAllProductsDetailVisible(false);
        }}
        onProductPress={(productId) => {
          pendingAllProductsRef.current = true;
          router.push({
            pathname: "/closet-product-detail",
            params: { id: productId, userId },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCaption: {
    marginTop: 8,
    color: "#11181C",
  },
  errorTitle: {
    fontSize: 16,
    color: "#11181C",
    marginBottom: 8,
    fontWeight: "600",
  },
  errorBody: {
    color: "#666A70",
    textAlign: "center",
    marginBottom: 16,
  },
  retryLink: {
    color: "#11181C",
    textDecorationLine: "underline",
    fontSize: 16,
  },
  inlineErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FEF3C7",
    gap: 12,
  },
  inlineErrorText: {
    flex: 1,
    color: "#92400E",
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
    overflow: "visible",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingLeft: 24,
    paddingRight: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandButton: {
    marginLeft: 8,
    transform: [{ translateY: 1 }],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  productCardPressable: {
    width: "100%",
  },
  racksGrid: {
    paddingTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rackTileWrap: {
    marginBottom: 28,
  },
  emptyClosetCard: {
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E3E3E7",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    minHeight: 120,
  },
  emptyClosetTitle: {
    fontSize: 16,
    color: "#666A70",
    textAlign: "center",
  },
});
