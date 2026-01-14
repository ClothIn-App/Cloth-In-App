import React, { useRef, useEffect } from "react";
import {
  FlatList,
  Animated,
  useWindowDimensions,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

type Product = {
  id: string;
};

type Props = {
  products: Product[];
  renderItem: (product: Product, width: number) => React.ReactNode;
  onFocusedIndexChange?: (index: number) => void;
  initialIndex?: number;
  variant?: "default" | "depth";
};

export default function FocusedProductCarousel({
  products,
  renderItem,
  onFocusedIndexChange,
  initialIndex = 0,
  variant = "default",
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(initialIndex);

  // Calculate dimensions based on variant
  const isDepth = variant === "depth";
  const itemWidth = isDepth 
    ? screenWidth * 0.23  // Smaller for depth variant to show more items (50% of original)
    : screenWidth * 0.26; // Default size (50% of original)
  const itemSpacing = isDepth ? 13 : 14;
  const sidePadding = 4; // Left padding for first card to be focused at start (reduced to hide overflow)
  
  // Each item takes: itemWidth + itemSpacing (width + marginHorizontal on both sides)
  const itemTotalWidth = itemWidth + itemSpacing;
  const snapInterval = itemTotalWidth;

  // Calculate vertical space needed for scaled card
  const baseCardHeight = itemWidth * 1.15; // ClosetProductCard aspect ratio
  const focusedScale = isDepth ? 1.16 : 1.12;
  const maxCardHeight = baseCardHeight * focusedScale;

  // Calculate getItemLayout for precise positioning
  const getItemLayout = (_: any, index: number) => ({
    length: itemTotalWidth,
    offset: index * itemTotalWidth,
    index,
  });

  // Scroll to initial index on mount
  useEffect(() => {
    if (initialIndex > 0 && products.length > 0) {
      const offset = initialIndex * itemTotalWidth;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: false });
      }, 100);
    }
  }, [initialIndex, itemTotalWidth, products.length]);

  // Handle scroll end to determine focused index
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // First card is focused at scroll position 0
    const index = Math.round(offsetX / snapInterval);
    const clampedIndex = Math.max(0, Math.min(index, products.length - 1));
    
    // Update focused index if it changed
    if (clampedIndex !== currentIndexRef.current) {
      currentIndexRef.current = clampedIndex;
      onFocusedIndexChange?.(clampedIndex);
    }
  };

  // Render each item with animated styles
  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => {
    if (isDepth) {
      // Depth variant: 5-level interpolation (focused at left, then adjacent, then far)
      // First card (index 0) is focused when scrollX is at 0
      const inputRange = [
        (index - 2) * itemTotalWidth,
        (index - 1) * itemTotalWidth,
        index * itemTotalWidth,
        (index + 1) * itemTotalWidth,
        (index + 2) * itemTotalWidth,
      ];

      // Scale: far 0.84, adjacent 0.94, focused 1.16, adjacent 0.94, far 0.84
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.84, 0.94, 1.16, 0.94, 0.84],
        extrapolate: "clamp",
      });

      // Opacity: far 0.62, adjacent 0.82, focused 1.0, adjacent 0.82, far 0.62
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.62, 0.82, 1.0, 0.82, 0.62],
        extrapolate: "clamp",
      });

      // TranslateY: far 10, adjacent 6, focused 0, adjacent 6, far 10
      const translateY = scrollX.interpolate({
        inputRange,
        outputRange: [10, 6, 0, 6, 10],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={{
            width: itemWidth,
            marginHorizontal: itemSpacing / 2, // Split spacing on both sides
            transform: [{ scale }, { translateY }],
            opacity,
          }}
        >
          {renderItem(item, itemWidth)}
        </Animated.View>
      );
    } else {
      // Default variant: 3-level interpolation
      // First card (index 0) is focused when scrollX is at 0
      const inputRange = [
        (index - 1) * itemTotalWidth,
        index * itemTotalWidth,
        (index + 1) * itemTotalWidth,
      ];

      // Scale: focused = 1.12, side items = 0.94
      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.94, 1.12, 0.94],
        extrapolate: "clamp",
      });

      // Opacity: focused = 1.0, side items = 0.8
      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.8, 1.0, 0.8],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={{
            width: itemWidth,
            marginHorizontal: itemSpacing / 2, // Split spacing on both sides
            transform: [{ scale }],
            opacity,
          }}
        >
          {renderItem(item, itemWidth)}
        </Animated.View>
      );
    }
  };

  // Content container style with special handling for single item
  const contentContainerStyle = {
    paddingLeft: sidePadding,
    paddingRight: screenWidth - itemWidth - sidePadding, // Right padding to allow last card to be visible
    alignItems: "center" as const,
    flexGrow: 1,
    ...(products.length <= 1 ? { justifyContent: "flex-start" as const } : {}),
  };

  return (
    <View
      style={{
        height: maxCardHeight,
        justifyContent: "center",
        overflow: "hidden", // Hide overflow to prevent product showing on left edge
        marginLeft: -.5, // Slight negative margin to shift content left and hide edge overflow
      }}
    >
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        {...(isDepth 
          ? {
              snapToInterval: snapInterval,
              snapToAlignment: "start",
            }
          : {
              snapToOffsets: products.map((_, index) => index * itemTotalWidth),
            }
        )}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        contentContainerStyle={contentContainerStyle}
        style={{ overflow: "visible" }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false } // Must be false to read scroll position for focused index
        )}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
      />
    </View>
  );
}
