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
};

export default function FocusedProductCarousel({
  products,
  renderItem,
  onFocusedIndexChange,
  initialIndex = 0,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(initialIndex);

  // Calculate dimensions
  const itemWidth = screenWidth * 0.52; // 52% of screen width for better peek
  const itemSpacing = 14;
  const sidePadding = (screenWidth - itemWidth) / 2; // Use only itemWidth for padding
  
  // Each item takes: itemWidth + itemSpacing (width + marginHorizontal on both sides)
  const itemTotalWidth = itemWidth + itemSpacing;
  const snapInterval = itemTotalWidth;

  // Calculate vertical space needed for scaled card
  const baseCardHeight = itemWidth * 1.15; // ClosetProductCard aspect ratio
  const focusedScale = 1.12;
  const maxCardHeight = baseCardHeight * focusedScale;

  // Calculate getItemLayout for precise positioning
  const getItemLayout = (_: any, index: number) => ({
    length: itemTotalWidth,
    offset: index * itemTotalWidth,
    index,
  });

  // Calculate snap offset adjustment (defined here so it's available in useEffect)
  const snapOffsetAdjustment = 6; // Negative value shifts right

  // Scroll to initial index on mount
  useEffect(() => {
    if (initialIndex > 0 && products.length > 0) {
      const offset = initialIndex * itemTotalWidth + snapOffsetAdjustment;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset, animated: false });
      }, 100);
    }
  }, [initialIndex, itemTotalWidth, products.length, snapOffsetAdjustment]);

  // Handle scroll end to determine focused index
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Account for the snap offset adjustment when calculating index
    const adjustedOffset = offsetX - snapOffsetAdjustment;
    const index = Math.round(adjustedOffset / itemTotalWidth);
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
  };

  // Calculate snap offsets - each item should snap so it's centered
  // Adjust slightly left for perfect centering (accounting for margins and padding)
  const snapOffsets = products.map((_, index) => index * itemTotalWidth + snapOffsetAdjustment);

  // Content container style with special handling for single item
  const contentContainerStyle = {
    paddingLeft: sidePadding,
    paddingRight: sidePadding,
    alignItems: "center" as const,
    flexGrow: 1,
    ...(products.length <= 1 ? { justifyContent: "center" as const } : {}),
  };

  return (
    <View
      style={{
        height: maxCardHeight,
        justifyContent: "center",
        overflow: "visible",
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
        snapToOffsets={snapOffsets}
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
