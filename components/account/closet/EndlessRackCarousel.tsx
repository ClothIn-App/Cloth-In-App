import React, { useRef, useEffect, useMemo } from "react";
import {
  FlatList,
  Animated,
  useWindowDimensions,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import ClosetPlaceholderCard from "./ClosetPlaceholderCard";

type Product = { id: string };

type Props = {
  products: Product[];
  renderItem: (product: Product, width: number) => React.ReactNode;
  placeholderText?: string;
  focusedScale?: number; // default 1.12
  itemSpacing?: number; // default 14
  horizontalPadding?: number; // default 12
};

type DisplayItem = Product | null; // null represents a placeholder

export default function EndlessRackCarousel({
  products,
  renderItem,
  placeholderText = "Post FitPic's to Add to Closet!",
  focusedScale = 1.12,
  itemSpacing = 14,
  horizontalPadding = 12,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  // NOTE: Animated onScroll with useNativeDriver requires an Animated-wrapped VirtualizedList.
  // We keep the ref as `any` to preserve access to FlatList instance methods (scrollToOffset, etc.).
  const flatListRef = useRef<any>(null);

  // Calculate item width so exactly 3 items fit
  const available = screenWidth - horizontalPadding * 2;
  const itemWidth = (available - itemSpacing * 2) / 3;
  const itemCellWidth = itemWidth + itemSpacing;
  const snapInterval = itemCellWidth;

  const animatedIndex = useMemo(
    () => Animated.divide(scrollX, itemCellWidth),
    [scrollX, itemCellWidth]
  );

  // Calculate height to accommodate scaled item
  const baseHeight = itemWidth * 1.15; // ClosetProductCard aspect ratio
  const containerHeight = baseHeight * focusedScale;
  const topCompensation = (baseHeight * (focusedScale - 1)) / 2;

  // Infinite scroll constants
  const repetitions = 7;
  const midCopy = Math.floor(repetitions / 2); // Should be 3
  const minSafeCopy = 1;
  const maxSafeCopy = repetitions - 2; // Should be 5

  // Determine if we should use infinite scrolling
  const useInfiniteScroll = products.length >= 3;

  // Build display data based on products length
  const displayData = useMemo<DisplayItem[]>(() => {
    if (!useInfiniteScroll) {
      // If less than 3 products, show exactly 3 slots: real products + placeholders
      const result: DisplayItem[] = [...products];
      while (result.length < 3) {
        result.push(null);
      }
      return result;
    } else {
      // If 3 or more products, build infinite loop data
      const loopData: Product[] = [];
      for (let i = 0; i < repetitions; i++) {
        loopData.push(...products);
      }
      return loopData;
    }
  }, [products, useInfiniteScroll, repetitions]);

  // Calculate starting index for infinite scroll (middle section)
  const middleCopyStartIndex = useMemo(() => {
    if (!useInfiniteScroll) return 0;
    return products.length * midCopy; // Start in the middle copy
  }, [products.length, useInfiniteScroll, midCopy]);

  // Scroll to initial position on mount (for infinite scroll)
  useEffect(() => {
    if (useInfiniteScroll && flatListRef.current) {
      const initialOffset = middleCopyStartIndex * itemCellWidth;
      setTimeout(() => {
        // Ensure the initially visible leftmost item is focused immediately (no first-interaction required).
        scrollX.setValue(initialOffset);
        flatListRef.current?.scrollToOffset({ offset: initialOffset, animated: false });
      }, 100);
    }
  }, [useInfiniteScroll, middleCopyStartIndex, itemCellWidth]);

  // Handle scroll end - detect if near edges and jump back to middle
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!useInfiniteScroll) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.floor((offsetX + itemCellWidth * 0.5) / itemCellWidth);

    // Calculate which copy we're in (each copy has products.length items)
    const copyIndex = Math.floor(currentIndex / products.length);

    // If we're too close to edges, jump to equivalent position in middle
    if (copyIndex < minSafeCopy || copyIndex > maxSafeCopy) {
      const positionInCopy = ((currentIndex % products.length) + products.length) % products.length;
      const equivalentIndex = products.length * midCopy + positionInCopy;
      const newOffset = equivalentIndex * itemCellWidth;
      scrollX.setValue(newOffset);
      flatListRef.current?.scrollToOffset({ offset: newOffset, animated: false });
    }
  };

  // Get item layout for stability
  const getItemLayout = (_: any, index: number) => ({
    length: itemCellWidth,
    offset: index * itemCellWidth,
    index,
  });

  // Key extractor - for infinite scroll, use index-based keys to handle duplicates
  const keyExtractor = (item: DisplayItem, index: number) => {
    if (item === null) {
      return `placeholder-${index}`;
    }
    if (useInfiniteScroll) {
      // For infinite scroll, use index to handle duplicate product IDs
      return `${item.id}-${index}`;
    }
    return item.id;
  };

  // Render carousel item
  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: DisplayItem;
    index: number;
  }) => {
    // Handle placeholder
    if (item === null) {
      return (
        <View
          style={{
            width: itemWidth,
            marginHorizontal: itemSpacing / 2,
          }}
        >
          <ClosetPlaceholderCard
            width={itemWidth}
            text={placeholderText}
            borderRadius={16}
          />
        </View>
      );
    }

    // Handle real product with animation
    // Use animated index approach: leftmost item is always focused
    const distance = Animated.subtract(index, animatedIndex);

    // Scale: distance=0 (focused) = focusedScale, others = 0.94
    const scale = distance.interpolate({
      inputRange: [-1, 0, 1, 2],
      outputRange: [0.94, focusedScale, 0.94, 0.94],
      extrapolate: "clamp",
    });

    // Opacity: distance=0 (focused) = 1.0, others = 0.85
    const opacity = distance.interpolate({
      inputRange: [-1, 0, 1, 2],
      outputRange: [0.85, 1.0, 0.85, 0.85],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          width: itemWidth,
          marginHorizontal: itemSpacing / 2,
          transform: [{ scale }],
          opacity,
        }}
      >
        {renderItem(item, itemWidth)}
      </Animated.View>
    );
  };

  // Content container style - only horizontal padding
  const contentContainerStyle = {
    paddingHorizontal: horizontalPadding,
  };

  return (
    <View
      style={{
        height: containerHeight,
        // Small left shift to hide any edge-peek of previous item.
        marginLeft: -2,
        // Make room above so the scaled (focused) card doesn't get visually clipped/overlap the header region.
        paddingTop: topCompensation,
        justifyContent: "flex-start",
        overflow: "hidden",
      }}
    >
      <Animated.FlatList
        ref={flatListRef}
        data={displayData}
        renderItem={renderCarouselItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={products.length > 1 ? snapInterval : undefined}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        contentContainerStyle={contentContainerStyle}
        style={{ overflow: "visible" }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        scrollEnabled={products.length > 1}
      />
    </View>
  );
}
