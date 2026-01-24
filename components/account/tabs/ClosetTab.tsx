import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import useAccountData from "../../../src/hooks/useAccountData";
import productsData from "../../../src/mocks/mock-products.json";
import { PRODUCT_ASSETS } from "../../../src/maps/images";
import ClosetProductCard from "../closet/ClosetProductCard";
import EndlessRackCarousel, {
  EndlessRackCarouselHandle,
} from "../closet/EndlessRackCarousel";
import RackStackTile from "../closet/RackStackTile";
import RackNameModal from "../closet/RackNameModal";
import RackOptionsMenu from "../closet/RackOptionsMenu";
import AllProductsOptionsMenu from "../closet/AllProductsOptionsMenu";
import ProductActionsMenu from "../closet/ProductActionsMenu";
import RackPickerMenu from "../closet/RackPickerMenu";
import RackDetailModal from "../closet/RackDetailModal";

type Props = {
  userId?: string;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  imagePath: string;
};

type Rack = {
  id: string;
  name: string;
  productIds: string[];
  createdAt?: number;
};

type ClosetData = {
  base?: {
    productIds: string[];
  };
  racks?: Rack[];
};

type AllProductsCarouselItemProps = {
  width: number;
  imageSource: any;
  productId: string;
  onOpenMenu: (productId: string) => void;
  onProductPress?: (productId: string) => void;
};

const AllProductsCarouselItem = React.memo(function AllProductsCarouselItem({
  width,
  imageSource,
  productId,
  onOpenMenu,
  onProductPress,
}: AllProductsCarouselItemProps) {
  const dotScale = useSharedValue(1);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={{ width }}>
      <View style={styles.productCardWrap}>
        <Pressable
          onPress={() => {
            if (onProductPress) {
              onProductPress(productId);
            }
          }}
          style={styles.productCardPressable}
        >
          <ClosetProductCard width={width} source={imageSource} borderRadius={16} />
        </Pressable>
        <Animated.View style={[styles.productOverflowWrap, dotStyle]}>
          <Pressable
            onPress={() => {
              dotScale.value = withSequence(
                withSpring(1.12, { damping: 14, stiffness: 240 }),
                withSpring(1, { damping: 14, stiffness: 240 })
              );
              onOpenMenu(productId);
            }}
            accessibilityRole="button"
            accessibilityLabel="Product options"
            pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
            hitSlop={8}
            style={styles.productOverflowButton}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#11181C" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
});

// Get products by IDs (helper function outside component for stability)
const getProductsByIds = (productIds: string[]): Product[] => {
  if (!productIds || !Array.isArray(productIds)) return [];
  return productIds
    .map((id) => {
      const product = (productsData as any).products.find(
        (p: any) => p.id === id
      );
      return product || null;
    })
    .filter((p): p is Product => p !== null);
};

export default function ClosetTab({ userId }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { data, loading } = useAccountData(userId);
  const initializedRef = useRef(false);
  const allProductsCarouselRef = useRef<EndlessRackCarouselHandle | null>(null);
  const preInitCreatedAtBaseRef = useRef(Date.now());

  const [baseProductIds, setBaseProductIds] = useState<string[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [createRackVisible, setCreateRackVisible] = useState(false);
  const [rackOptionsRackId, setRackOptionsRackId] = useState<string | null>(null);
  const [renameRackId, setRenameRackId] = useState<string | null>(null);
  const [allProductsOptionsVisible, setAllProductsOptionsVisible] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [productActionsVisible, setProductActionsVisible] = useState(false);
  const [rackPickerVisible, setRackPickerVisible] = useState(false);
  const [highlightedRackId, setHighlightedRackId] = useState<string | null>(null);
  const [rackDetailVisible, setRackDetailVisible] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [allProductsDetailVisible, setAllProductsDetailVisible] = useState(false);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  // If the userId resolves after first render, we should re-initialize local closet state
  // from fetched data. This also prevents a flash of "empty closet" placeholders.
  useEffect(() => {
    initializedRef.current = false;
    setBaseProductIds([]);
    setRacks([]);
  }, [userId]);
  const pauseAndResumeCarousel = () => {
    const carousel = allProductsCarouselRef.current;
    if (!carousel) return;
    carousel.pauseAutoDrift();
    carousel.resumeAutoDrift();
  };

  // When the carousel is continuously moving, it can interfere with press recognition.
  // Pausing it on any touch within the Closet scroll area keeps taps responsive,
  // and using `onPress` still prevents accidental triggers during scroll.
  const pauseCarousel = () => {
    allProductsCarouselRef.current?.pauseAutoDrift();
  };

  const resumeCarousel = () => {
    allProductsCarouselRef.current?.resumeAutoDrift();
  };

  // Safely access closet data (using type assertion since ProfileMe doesn't include closet yet)
  const closetData = useMemo(() => {
    const me = data.me as any;
    const closet = me?.closet as ClosetData | undefined;
    
    if (!closet) {
      return {
        baseProductIds: [] as string[],
        racks: [] as Rack[],
      };
    }

    const baseProductIds = closet.base?.productIds || [];
    const racks = closet.racks || [];

    return {
      baseProductIds,
      racks: racks.filter((rack: Rack) => rack && rack.id && rack.name),
    };
  }, [data.me]);

  // Initialize local state once from fetched data (in-memory edits should not be overwritten).
  useEffect(() => {
    if (initializedRef.current) return;
    if (loading) return;

    setBaseProductIds(closetData.baseProductIds);
    setRacks(
      closetData.racks.map((r) => ({
        ...r,
        createdAt: r.createdAt ?? Date.now(),
      }))
    );

    initializedRef.current = true;
  }, [loading, closetData.baseProductIds, closetData.racks]);

  // Avoid the "All Products only" flash: until we've initialized local state,
  // render from fetched closetData so the first post-loading render matches the full layout.
  const effectiveBaseProductIds = initializedRef.current
    ? baseProductIds
    : closetData.baseProductIds;

  const preInitRacks = useMemo(() => {
    const base = preInitCreatedAtBaseRef.current;
    return closetData.racks.map((r, idx) => ({
      ...r,
      createdAt: r.createdAt ?? base + idx,
    }));
  }, [closetData.racks]);

  const effectiveRacks = initializedRef.current ? racks : preInitRacks;

  // Get products for each section
  const allProducts = useMemo(
    () => getProductsByIds(effectiveBaseProductIds),
    [effectiveBaseProductIds]
  );

  const rackSections = useMemo(() => {
    const sorted = [...effectiveRacks].sort((a, b) => {
      const at = a.createdAt ?? 0;
      const bt = b.createdAt ?? 0;
      return at - bt;
    });

    return sorted.map((rack: Rack) => ({
      id: rack.id,
      name: rack.name,
      products: getProductsByIds(rack.productIds || []),
    }));
  }, [effectiveRacks]);

  const selectedRack = useMemo(() => {
    if (!rackOptionsRackId) return null;
    return racks.find((r) => r.id === rackOptionsRackId) ?? null;
  }, [rackOptionsRackId, racks]);

  const renamingRack = useMemo(() => {
    if (!renameRackId) return null;
    return racks.find((r) => r.id === renameRackId) ?? null;
  }, [renameRackId, racks]);

  const selectedRackForDetail = useMemo(() => {
    if (!selectedRackId) return null;
    return rackSections.find((r) => r.id === selectedRackId) ?? null;
  }, [selectedRackId, rackSections]);

  if (loading || !userId) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#11181C" }}>Loading Closet...</Text>
      </View>
    );
  }

  // Render a product section with focused carousel
  const renderProductSection = (
    title: string,
    products: Product[],
    key: string,
    opts?: { alwaysShow?: boolean }
  ) => {
    const alwaysShow = opts?.alwaysShow ?? false;
    if (!alwaysShow && (!products || products.length === 0)) {
      return null;
    }

    // Filter products that have valid image sources
    const productsWithImages = products.filter(
      (product) => PRODUCT_ASSETS[product.id]
    );

    if (!alwaysShow && productsWithImages.length === 0) {
      return null;
    }

    return (
      <View key={key} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            {title === "All Products" ? (
              <Pressable
                onPress={() => {
                  pauseAndResumeCarousel();
                  setAllProductsDetailVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Expand All Products"
                // Make scroll gestures win over accidental presses.
                pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
                hitSlop={6}
              >
                <Text style={styles.sectionTitle}>{title}</Text>
              </Pressable>
            ) : (
              <Text style={styles.sectionTitle}>{title}</Text>
            )}
            {title === "All Products" && (
              <Pressable
                onPress={() => {
                  pauseAndResumeCarousel();
                  setAllProductsDetailVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Expand All Products"
                // Make scroll gestures win over accidental presses.
                pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
                hitSlop={6}
                style={styles.expandButton}
              >
                <Ionicons name="expand" size={20} color="#11181C" />
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                pauseAndResumeCarousel();
                setAllProductsOptionsVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Rack options"
              // Make scroll gestures win over accidental presses.
              pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
              hitSlop={6}
              style={styles.expandButton}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#11181C" />
            </Pressable>
          </View>
          {title === "All Products" && (
            <Pressable
              onPress={() => {
                pauseAndResumeCarousel();
                setCreateRackVisible(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Add new rack"
              // Make scroll gestures win over accidental presses.
              pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
              hitSlop={6}
              style={styles.addRackButton}
            >
              <Ionicons name="add-circle-outline" size={22} color="#11181C" />
            </Pressable>
          )}
        </View>
        <EndlessRackCarousel
          ref={title === "All Products" ? allProductsCarouselRef : undefined}
          products={productsWithImages}
          renderItem={(product, width) => {
            const imageSource = PRODUCT_ASSETS[product.id];
            if (!imageSource) {
              return null;
            }
            if (title !== "All Products") {
              return <ClosetProductCard width={width} source={imageSource} borderRadius={16} />;
            }

            return (
              <AllProductsCarouselItem
                width={width}
                imageSource={imageSource}
                productId={product.id}
                onOpenMenu={(id) => {
                  pauseAndResumeCarousel();
                  setActiveProductId(id);
                  setProductActionsVisible(true);
                }}
                onProductPress={(productId) => {
                  if (userId) {
                    router.push({
                      pathname: "/closet-product-detail",
                      params: { id: productId, userId },
                    });
                  }
                }}
              />
            );
          }}
          // Disable auto-play: allow only manual swiping in Closet.
          autoDriftEnabled={false}
        />
      </View>
    );
  };

  const gridHorizontalPadding = 24;
  const gridColumnGap = 12;
  const tileWidth =
    (screenWidth - gridHorizontalPadding * 2 - gridColumnGap) / 2;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 16 + insets.bottom }]}
        onTouchStart={pauseCarousel}
        onTouchEnd={resumeCarousel}
        onScrollBeginDrag={pauseCarousel}
      >
        {/* All Products Section */}
        {renderProductSection("All Products", allProducts, "all-products", {
          alwaysShow: true,
        })}

        {/* Rack Grid */}
        <View style={[styles.racksGrid, { paddingHorizontal: gridHorizontalPadding }]}>
          {rackSections.map((rack, idx) => {
            const items = rack.products
              .filter((p) => PRODUCT_ASSETS[p.id])
              .slice(0, 3)
              .map((p) => ({
                id: p.id,
                source: PRODUCT_ASSETS[p.id],
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
                  highlighted={highlightedRackId === rack.id}
                  onPressExpand={() => {
                    pauseAndResumeCarousel();
                    setRackOptionsRackId(rack.id);
                  }}
                  onPress={() => {
                    pauseAndResumeCarousel();
                    setSelectedRackId(rack.id);
                    setRackDetailVisible(true);
                  }}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <RackNameModal
        visible={createRackVisible}
        title="New rack"
        submitLabel="Create"
        existingNames={racks.map((r) => r.name)}
        onClose={() => setCreateRackVisible(false)}
        onSubmit={(name) => {
          const id = `rack-${Date.now()}`;
          setRacks((prev) => [
            ...prev,
            { id, name, productIds: [], createdAt: Date.now() },
          ]);
        }}
      />

      <RackOptionsMenu
        visible={!!selectedRack}
        rackName={selectedRack?.name ?? ""}
        onClose={() => setRackOptionsRackId(null)}
        onViewRack={() => {
          // Wire up to rack detail later.
          setRackOptionsRackId(null);
        }}
        onRenameRack={() => {
          if (!selectedRack) return;
          setRackOptionsRackId(null);
          setRenameRackId(selectedRack.id);
        }}
        onDeleteRack={() => {
          if (!selectedRack) return;
          Alert.alert(
            "Delete rack?",
            `This will delete “${selectedRack.name}”.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  setRacks((prev) => prev.filter((r) => r.id !== selectedRack.id));
                  setRackOptionsRackId(null);
                },
              },
            ]
          );
        }}
      />

      <RackNameModal
        visible={!!renamingRack}
        title="Edit rack name"
        submitLabel="Save"
        initialValue={renamingRack?.name ?? ""}
        existingNames={racks.map((r) => r.name)}
        onClose={() => setRenameRackId(null)}
        onSubmit={(name) => {
          if (!renamingRack) return;
          setRacks((prev) =>
            prev.map((r) => (r.id === renamingRack.id ? { ...r, name } : r))
          );
          setRenameRackId(null);
        }}
      />

      <AllProductsOptionsMenu
        visible={allProductsOptionsVisible}
        onClose={() => setAllProductsOptionsVisible(false)}
        onSort={() => setAllProductsOptionsVisible(false)}
        onFilter={() => setAllProductsOptionsVisible(false)}
        onSelectMode={() => setAllProductsOptionsVisible(false)}
      />

      <ProductActionsMenu
        visible={productActionsVisible}
        onClose={() => {
          setProductActionsVisible(false);
          setActiveProductId(null);
        }}
        onMove={() => {
          setProductActionsVisible(false);
          setRackPickerVisible(true);
        }}
        onDelete={() => {
          if (!activeProductId) return;
          const productId = activeProductId;
          setProductActionsVisible(false);
          Alert.alert(
            "Delete from closet?",
            "This will remove this product from All Products and every rack.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  setBaseProductIds((prev) => prev.filter((id) => id !== productId));
                  setRacks((prev) =>
                    prev.map((r) => ({
                      ...r,
                      productIds: (r.productIds || []).filter((id) => id !== productId),
                    }))
                  );
                  setActiveProductId(null);
                },
              },
            ]
          );
        }}
      />

      <RackPickerMenu
        visible={rackPickerVisible}
        racks={racks.map((r) => ({ id: r.id, name: r.name }))}
        onClose={() => {
          setRackPickerVisible(false);
          setActiveProductId(null);
        }}
        onSelectRack={(rackId) => {
          if (!activeProductId) return;
          const productId = activeProductId;
          setRackPickerVisible(false);
          setActiveProductId(null);

          setRacks((prev) =>
            prev.map((r) => {
              if (r.id !== rackId) return r;
              const next = new Set([...(r.productIds || []), productId]);
              return { ...r, productIds: Array.from(next) };
            })
          );

          setHighlightedRackId(rackId);
          if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
          highlightTimeoutRef.current = setTimeout(() => setHighlightedRackId(null), 700);
        }}
      />

      <RackDetailModal
        visible={rackDetailVisible}
        rackName={selectedRackForDetail?.name ?? ""}
        products={
          selectedRackForDetail?.products
            ?.filter((p) => PRODUCT_ASSETS[p.id])
            .map((p) => ({
              id: p.id,
              source: PRODUCT_ASSETS[p.id],
            })) ?? []
        }
        onClose={() => {
          setRackDetailVisible(false);
          setSelectedRackId(null);
        }}
        onProductRemoveFromRack={(productId) => {
          if (!selectedRackId) return;
          setRacks((prev) =>
            prev.map((r) => {
              if (r.id !== selectedRackId) return r;
              return {
                ...r,
                productIds: (r.productIds || []).filter((id) => id !== productId),
              };
            })
          );
        }}
        onProductMove={(productId) => {
          setActiveProductId(productId);
          setRackPickerVisible(true);
        }}
        onProductDelete={(productId) => {
          Alert.alert(
            "Delete from closet?",
            "This will remove this product from All Products and every rack.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  setBaseProductIds((prev) => prev.filter((id) => id !== productId));
                  setRacks((prev) =>
                    prev.map((r) => ({
                      ...r,
                      productIds: (r.productIds || []).filter((id) => id !== productId),
                    }))
                  );
                },
              },
            ]
          );
        }}
        onProductPress={(productId) => {
          if (userId) {
            router.push({
              pathname: "/closet-product-detail",
              params: { id: productId, userId },
            });
          }
        }}
        userId={userId}
      />

      <RackDetailModal
        visible={allProductsDetailVisible}
        rackName="All Products"
        products={allProducts
          .filter((p) => PRODUCT_ASSETS[p.id])
          .map((p) => ({
            id: p.id,
            source: PRODUCT_ASSETS[p.id],
          }))}
        onClose={() => {
          setAllProductsDetailVisible(false);
        }}
        onProductRemoveFromRack={(productId) => {
          setBaseProductIds((prev) => prev.filter((id) => id !== productId));
        }}
        onProductMove={(productId) => {
          setActiveProductId(productId);
          setRackPickerVisible(true);
        }}
        onProductDelete={(productId) => {
          Alert.alert(
            "Delete from closet?",
            "This will remove this product from All Products and every rack.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  setBaseProductIds((prev) => prev.filter((id) => id !== productId));
                  setRacks((prev) =>
                    prev.map((r) => ({
                      ...r,
                      productIds: (r.productIds || []).filter((id) => id !== productId),
                    }))
                  );
                },
              },
            ]
          );
        }}
        onProductPress={(productId) => {
          if (userId) {
            router.push({
              pathname: "/closet-product-detail",
              params: { id: productId, userId },
            });
          }
        }}
        userId={userId}
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
  section: {
    marginBottom: 32,
    overflow: "visible",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingLeft: 24, // slight right shift vs other aligned content
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
  addRackButton: {
    transform: [{ translateY: 1 }],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  loadingText: {
    fontSize: 14,
    color: "#666A70",
    textAlign: "center",
    marginTop: 24,
  },
  racksGrid: {
    paddingTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rackTileWrap: {
    marginBottom: 28,
  },
  productCardWrap: {
    position: "relative",
  },
  productCardPressable: {
    width: "100%",
  },
  productOverflowWrap: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  productOverflowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
});

