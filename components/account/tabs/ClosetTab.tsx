import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Alert,
  Animated,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
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
  pinned?: boolean;
  createdAt?: number;
};

type ClosetData = {
  base?: {
    productIds: string[];
  };
  racks?: Rack[];
};

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
  const { data, loading } = useAccountData(userId || '');
  const initializedRef = useRef(false);
  const allProductsCarouselRef = useRef<EndlessRackCarouselHandle | null>(null);

  const [baseProductIds, setBaseProductIds] = useState<string[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [createRackVisible, setCreateRackVisible] = useState(false);
  const [rackOptionsRackId, setRackOptionsRackId] = useState<string | null>(null);
  const [renameRackId, setRenameRackId] = useState<string | null>(null);
  const [allProductsOptionsVisible, setAllProductsOptionsVisible] = useState(false);
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

  // Drag & drop state (All Products -> rack tiles)
  const [isDragging, setIsDragging] = useState(false);
  const [hoverRackId, setHoverRackId] = useState<string | null>(null);
  const draggedRef = useRef<{
    productId: string;
    source: any;
    width: number;
    height: number;
  } | null>(null);
  const [dragged, setDragged] = useState<typeof draggedRef.current>(null);
  const dragXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const rackTileRefs = useRef<Record<string, any>>({});
  const rackRectsRef = useRef<Record<string, { x: number; y: number; w: number; h: number }>>(
    {}
  );

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
        pinned: r.pinned ?? false,
        createdAt: r.createdAt ?? Date.now(),
      }))
    );

    initializedRef.current = true;
  }, [loading, closetData.baseProductIds, closetData.racks]);

  // Get products for each section
  const allProducts = useMemo(
    () => getProductsByIds(baseProductIds),
    [baseProductIds]
  );

  const rackSections = useMemo(() => {
    const sorted = [...racks].sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;
      if (ap !== bp) return bp - ap; // pinned first
      const at = a.createdAt ?? 0;
      const bt = b.createdAt ?? 0;
      return at - bt;
    });

    return sorted.map((rack: Rack) => ({
      id: rack.id,
      name: rack.name,
      products: getProductsByIds(rack.productIds || []),
      pinned: rack.pinned ?? false,
    }));
  }, [racks]);

  const selectedRack = useMemo(() => {
    if (!rackOptionsRackId) return null;
    return racks.find((r) => r.id === rackOptionsRackId) ?? null;
  }, [rackOptionsRackId, racks]);

  const renamingRack = useMemo(() => {
    if (!renameRackId) return null;
    return racks.find((r) => r.id === renameRackId) ?? null;
  }, [renameRackId, racks]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading closet...</Text>
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
            <Text style={styles.sectionTitle}>{title}</Text>
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
            return (
              <DraggableAllProductsCard
                productId={product.id}
                width={width}
                source={imageSource}
                onStartDrag={(pageX, pageY) => {
                  // close any open menus during drag
                  setAllProductsOptionsVisible(false);
                  setRackOptionsRackId(null);
                  setRenameRackId(null);
                  setCreateRackVisible(false);

                  const height = width * 1.15;
                  draggedRef.current = { productId: product.id, source: imageSource, width, height };
                  setDragged(draggedRef.current);
                  setIsDragging(true);
                  setHoverRackId(null);

                  // Measure rack drop targets once at drag start.
                  const nextRects: Record<string, { x: number; y: number; w: number; h: number }> =
                    {};
                  Object.entries(rackTileRefs.current).forEach(([rackId, node]) => {
                    if (!node?.measureInWindow) return;
                    node.measureInWindow((x: number, y: number, w: number, h: number) => {
                      nextRects[rackId] = { x, y, w, h };
                      rackRectsRef.current = { ...rackRectsRef.current, ...nextRects };
                    });
                  });

                  dragXY.setValue({ x: pageX - width / 2, y: pageY - height / 2 });
                }}
                onMoveDrag={(moveX, moveY) => {
                  const d = draggedRef.current;
                  if (!d) return;
                  dragXY.setValue({ x: moveX - d.width / 2, y: moveY - d.height / 2 });

                  let nextHover: string | null = null;
                  for (const [rid, rect] of Object.entries(rackRectsRef.current)) {
                    if (
                      moveX >= rect.x &&
                      moveX <= rect.x + rect.w &&
                      moveY >= rect.y &&
                      moveY <= rect.y + rect.h
                    ) {
                      nextHover = rid;
                      break;
                    }
                  }
                  setHoverRackId((prev) => (prev === nextHover ? prev : nextHover));
                }}
                onEndDrag={(moveX, moveY) => {
                  const d = draggedRef.current;
                  let dropId: string | null = null;
                  for (const [rid, rect] of Object.entries(rackRectsRef.current)) {
                    if (
                      moveX >= rect.x &&
                      moveX <= rect.x + rect.w &&
                      moveY >= rect.y &&
                      moveY <= rect.y + rect.h
                    ) {
                      dropId = rid;
                      break;
                    }
                  }

                  if (d && dropId) {
                    setRacks((prev) =>
                      prev.map((r) => {
                        if (r.id !== dropId) return r;
                        const next = new Set(r.productIds ?? []);
                        next.add(d.productId);
                        return { ...r, productIds: Array.from(next) };
                      })
                    );
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }

                  draggedRef.current = null;
                  setDragged(null);
                  setHoverRackId(null);
                  setIsDragging(false);
                }}
              />
            );
          }}
          placeholderText="Post FitPic’s to Add to Closet!"
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
        scrollEnabled={!isDragging}
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
                ref={(node) => {
                  rackTileRefs.current[rack.id] = node;
                }}
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
                  onPressExpand={() => {
                    pauseAndResumeCarousel();
                    setRackOptionsRackId(rack.id);
                  }}
                  highlighted={hoverRackId === rack.id}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {isDragging && dragged && (
        <View style={styles.dragOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.dragGhost,
              {
                transform: dragXY.getTranslateTransform(),
              },
            ]}
          >
            <ClosetProductCard width={dragged.width} source={dragged.source} borderRadius={16} />
          </Animated.View>
        </View>
      )}

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
            { id, name, productIds: [], pinned: false, createdAt: Date.now() },
          ]);
        }}
      />

      <RackOptionsMenu
        visible={!!selectedRack}
        rackName={selectedRack?.name ?? ""}
        pinned={!!selectedRack?.pinned}
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
        onTogglePin={() => {
          if (!selectedRack) return;
          setRacks((prev) =>
            prev.map((r) => (r.id === selectedRack.id ? { ...r, pinned: !r.pinned } : r))
          );
          setRackOptionsRackId(null);
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
    </View>
  );
}

function DraggableAllProductsCard({
  productId,
  width,
  source,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
}: {
  productId: string;
  width: number;
  source: any;
  onStartDrag: (pageX: number, pageY: number) => void;
  onMoveDrag: (moveX: number, moveY: number) => void;
  onEndDrag: (moveX: number, moveY: number) => void;
}) {
  const dragEnabledRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: () => dragEnabledRef.current,
        onMoveShouldSetPanResponderCapture: () => dragEnabledRef.current,
        onPanResponderMove: (_evt, gesture) => {
          if (!dragEnabledRef.current) return;
          onMoveDrag(gesture.moveX, gesture.moveY);
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (!dragEnabledRef.current) return;
          dragEnabledRef.current = false;
          onEndDrag(gesture.moveX, gesture.moveY);
        },
        onPanResponderTerminate: (_evt, gesture) => {
          if (!dragEnabledRef.current) return;
          dragEnabledRef.current = false;
          onEndDrag(gesture.moveX, gesture.moveY);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [onEndDrag, onMoveDrag]
  );

  const handleLongPress = (e: GestureResponderEvent) => {
    // Mark as draggable; next movement will claim the responder.
    dragEnabledRef.current = true;
    onStartDrag(e.nativeEvent.pageX, e.nativeEvent.pageY);
  };

  return (
    <View {...panResponder.panHandlers}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={250}
        accessibilityRole="button"
        accessibilityLabel={`Product ${productId}`}
      >
        <ClosetProductCard width={width} source={source} borderRadius={16} />
      </Pressable>
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
  dragOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  dragGhost: {
    position: "absolute",
    opacity: 0.95,
  },
});

