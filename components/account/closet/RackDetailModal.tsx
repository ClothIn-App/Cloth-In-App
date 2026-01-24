import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ImageSourcePropType,
  Animated,
  Dimensions,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import ReanimatedAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import ClosetProductCard from "./ClosetProductCard";
import RackProductActionsMenu from "./RackProductActionsMenu";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(SCREEN_H * 0.9);

type Product = {
  id: string;
  source: ImageSourcePropType;
};

type Props = {
  visible: boolean;
  rackName: string;
  products: Product[];
  onClose: () => void;
  onProductRemoveFromRack?: (productId: string) => void;
  onProductMove?: (productId: string) => void;
  onProductDelete?: (productId: string) => void;
};

const RackProductCard = React.memo(function RackProductCard({
  product,
  width,
  onOpenMenu,
}: {
  product: Product;
  width: number;
  onOpenMenu: (productId: string) => void;
}) {
  const dotScale = useSharedValue(1);
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={{ width }}>
      <View style={styles.productCardWrap}>
        <ClosetProductCard width={width} source={product.source} borderRadius={16} />
        <ReanimatedAnimated.View style={[styles.productOverflowWrap, dotStyle]}>
          <Pressable
            onPress={() => {
              dotScale.value = withSequence(
                withSpring(1.12, { damping: 14, stiffness: 240 }),
                withSpring(1, { damping: 14, stiffness: 240 })
              );
              onOpenMenu(product.id);
            }}
            accessibilityRole="button"
            accessibilityLabel="Product options"
            pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
            hitSlop={8}
            style={styles.productOverflowButton}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#11181C" />
          </Pressable>
        </ReanimatedAnimated.View>
      </View>
    </View>
  );
});

export default function RackDetailModal({
  visible,
  rackName,
  products,
  onClose,
  onProductRemoveFromRack,
  onProductMove,
  onProductDelete,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [productActionsVisible, setProductActionsVisible] = useState(false);

  const baseTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Calculate grid layout: 3 columns
  const horizontalPadding = 16;
  const columnGap = 12;
  const availableWidth = screenWidth - horizontalPadding * 2;
  const itemWidth = (availableWidth - columnGap * 2) / 3;

  // Group products into rows of 3
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 3) {
    rows.push(products.slice(i, i + 3));
  }

  const openAnim = useCallback(() => {
    dragY.setValue(0);
    Animated.parallel([
      Animated.timing(baseTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [baseTranslateY, backdropOpacity, dragY]);

  const closeAnim = useCallback(
    (cb?: () => void) => {
      Animated.parallel([
        Animated.timing(baseTranslateY, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        dragY.setValue(0);
        if (finished) cb?.();
      });
    },
    [baseTranslateY, backdropOpacity, dragY]
  );

  useEffect(() => {
    if (visible) {
      openAnim();
    } else {
      baseTranslateY.setValue(SHEET_HEIGHT);
      backdropOpacity.setValue(0);
      dragY.setValue(0);
    }
  }, [visible, openAnim, baseTranslateY, backdropOpacity, dragY]);

  const handleClose = useCallback(() => {
    closeAnim(onClose);
  }, [closeAnim, onClose]);

  const onGestureEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationY: dragY } }], {
        useNativeDriver: true,
      }),
    [dragY]
  );

  const onHandlerStateChange = useCallback(
    (e: any) => {
      const { state, translationY } = e.nativeEvent || {};
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        const halfwayPoint = SHEET_HEIGHT / 2;
        const shouldClose = translationY > halfwayPoint;
        if (shouldClose) {
          handleClose();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 20,
          }).start();
        }
      }
    },
    [dragY, handleClose]
  );

  const dragClamped = dragY.interpolate({
    inputRange: [-1000, 0, SHEET_HEIGHT],
    outputRange: [0, 0, SHEET_HEIGHT],
    extrapolate: "clamp",
  });

  const combinedTranslateY = Animated.add(baseTranslateY, dragClamped);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetY={10}
          failOffsetX={[-50, 50]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                height: SHEET_HEIGHT,
                paddingBottom: insets.bottom,
                transform: [{ translateY: combinedTranslateY }],
              },
            ]}
          >
            <View style={styles.grabberArea}>
              <View style={styles.grabberBar} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <Text style={styles.headerTitle} numberOfLines={1}>
                {rackName}
              </Text>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#11181C" />
              </Pressable>
            </View>

            {/* Products Grid */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingHorizontal: horizontalPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {products.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Add Products to This Rack</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                      {row.map((product) => (
                        <RackProductCard
                          key={product.id}
                          product={product}
                          width={itemWidth}
                          onOpenMenu={(id) => {
                            setActiveProductId(id);
                            setProductActionsVisible(true);
                          }}
                        />
                      ))}
                      {/* Fill remaining space if row has less than 3 items */}
                      {row.length < 3 &&
                        Array.from({ length: 3 - row.length }).map((_, i) => (
                          <View key={`spacer-${i}`} style={{ width: itemWidth }} />
                        ))}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>

      <RackProductActionsMenu
        visible={productActionsVisible}
        onClose={() => {
          setProductActionsVisible(false);
          setActiveProductId(null);
        }}
        onRemoveFromRack={() => {
          if (activeProductId && onProductRemoveFromRack) {
            onProductRemoveFromRack(activeProductId);
          }
          setProductActionsVisible(false);
          setActiveProductId(null);
        }}
        onMoveToAnotherRack={() => {
          if (activeProductId && onProductMove) {
            onProductMove(activeProductId);
          }
          setProductActionsVisible(false);
          setActiveProductId(null);
        }}
        onDelete={() => {
          if (activeProductId && onProductDelete) {
            onProductDelete(activeProductId);
          }
          setProductActionsVisible(false);
          setActiveProductId(null);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  grabberArea: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  grabberBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E6E6",
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#11181C",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
    width: 32,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  productCardWrap: {
    position: "relative",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666A70",
    textAlign: "center",
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
