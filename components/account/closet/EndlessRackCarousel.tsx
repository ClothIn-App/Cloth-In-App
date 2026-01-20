import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
  autoDriftEnabled?: boolean; // default false (used by ClosetTab)
  autoDriftSpeedPxPerSec?: number; // default 18
  // Slideshow-style: advance one snap every N ms.
  autoSlideIntervalMs?: number; // default 2200
  autoResumeDelayMs?: number; // default 3000
};

type DisplayItem = Product | null; // null represents a placeholder

export type EndlessRackCarouselHandle = {
  pauseAutoDrift: () => void;
  resumeAutoDrift: () => void;
};

const EndlessRackCarousel = forwardRef<EndlessRackCarouselHandle, Props>(function EndlessRackCarousel(
  {
    products,
    renderItem,
    placeholderText = "Post FitPic's to Add to Closet!",
    focusedScale = 1.12,
    itemSpacing = 14,
    horizontalPadding = 12,
    autoDriftEnabled = false,
    autoDriftSpeedPxPerSec = 18,
    autoSlideIntervalMs = 2200,
    autoResumeDelayMs = 3000,
  }: Props,
  ref
) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const scrollOffsetRef = useRef(0);
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [manualOverride, setManualOverride] = useState(false); // true = user is controlling / cooldown

  // Calculate item width so exactly 3 items fit
  const available = screenWidth - horizontalPadding * 2;
  const itemWidth = (available - itemSpacing * 2) / 3;
  const itemCellWidth = itemWidth + itemSpacing;
  const snapInterval = itemCellWidth;

  // Calculate height to accommodate scaled item
  const baseHeight = itemWidth * 1.15; // ClosetProductCard aspect ratio
  const containerHeight = baseHeight * focusedScale;
  const topCompensation = (baseHeight * (focusedScale - 1)) / 2;

  // Always model the rack as exactly 3 slots (products first, then placeholders).
  // This lets 1–2 product racks behave like any other rack (including 360 looping).
  const baseItems = useMemo<DisplayItem[]>(() => {
    const result: DisplayItem[] = [...products];
    while (result.length < 3) result.push(null);
    return result;
  }, [products]);
  const baseLength = baseItems.length; // always 3 (unless products > 3 in the future)

  // Infinite scroll constants
  const repetitions = 7;
  const midCopy = Math.floor(repetitions / 2); // Should be 3
  const minSafeCopy = 1;
  const maxSafeCopy = repetitions - 2; // Should be 5

  // Determine if we should use infinite scrolling
  const useInfiniteScroll = baseLength >= 3;

  // Build display data based on products length
  const displayData = useMemo<DisplayItem[]>(() => {
    if (!useInfiniteScroll) return baseItems;

    // Build infinite loop data by repeating the 3-slot rack (products + placeholders).
    const loopData: DisplayItem[] = [];
    for (let i = 0; i < repetitions; i++) {
      loopData.push(...baseItems);
    }
    return loopData;
  }, [baseItems, useInfiniteScroll, repetitions]);

  // Calculate starting index for infinite scroll (middle section)
  const middleCopyStartIndex = useMemo(() => {
    if (!useInfiniteScroll) return 0;
    return baseLength * midCopy; // Start in the middle copy
  }, [baseLength, useInfiniteScroll, midCopy]);

  // Scroll to initial position on mount (for infinite scroll)
  useEffect(() => {
    if (useInfiniteScroll && flatListRef.current) {
      const initialOffset = middleCopyStartIndex * itemCellWidth;
      setTimeout(() => {
        // Ensure the initially visible leftmost item is focused immediately (no first-interaction required).
        scrollX.setValue(initialOffset);
        scrollOffsetRef.current = initialOffset;
        flatListRef.current?.scrollToOffset({ offset: initialOffset, animated: false });
      }, 100);
    }
  }, [useInfiniteScroll, middleCopyStartIndex, itemCellWidth]);

  // Handle scroll end - detect if near edges and jump back to middle
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!useInfiniteScroll) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    scrollOffsetRef.current = offsetX;
    const currentIndex = Math.floor((offsetX + itemCellWidth * 0.5) / itemCellWidth);

    // Calculate which copy we're in (each copy has baseLength items)
    const copyIndex = Math.floor(currentIndex / baseLength);

    // If we're too close to edges, jump to equivalent position in middle
    if (copyIndex < minSafeCopy || copyIndex > maxSafeCopy) {
      const positionInCopy = ((currentIndex % baseLength) + baseLength) % baseLength;
      const equivalentIndex = baseLength * midCopy + positionInCopy;
      const newOffset = equivalentIndex * itemCellWidth;
      flatListRef.current?.scrollToOffset({ offset: newOffset, animated: false });
      scrollX.setValue(newOffset);
      scrollOffsetRef.current = newOffset;
    }
  };

  const clearResumeTimer = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const stopAutoDrift = useCallback(() => {
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }, []);

  const startAutoDrift = useCallback(() => {
    stopAutoDrift();
    if (!flatListRef.current) return;
    if (!useInfiniteScroll) return;

    slideTimerRef.current = setInterval(() => {
      const nextOffsetRaw = scrollOffsetRef.current + snapInterval;
      const nextOffset = (() => {
        if (!useInfiniteScroll) return nextOffsetRaw;
        const currentIndex = Math.floor((nextOffsetRaw + itemCellWidth * 0.5) / itemCellWidth);
        const copyIndex = Math.floor(currentIndex / baseLength);
        if (copyIndex < minSafeCopy || copyIndex > maxSafeCopy) {
          const positionInCopy = ((currentIndex % baseLength) + baseLength) % baseLength;
          const equivalentIndex = baseLength * midCopy + positionInCopy;
          return equivalentIndex * itemCellWidth;
        }
        return nextOffsetRaw;
      })();

      const didJump = nextOffset !== nextOffsetRaw;
      scrollOffsetRef.current = nextOffset;
      scrollX.setValue(nextOffset);
      flatListRef.current?.scrollToOffset({ offset: nextOffset, animated: !didJump });
    }, autoSlideIntervalMs);
  }, [
    stopAutoDrift,
    useInfiniteScroll,
    snapInterval,
    itemCellWidth,
    baseLength,
    minSafeCopy,
    maxSafeCopy,
    midCopy,
    autoSlideIntervalMs,
    scrollX,
  ]);

  const autoActive = autoDriftEnabled && !manualOverride;
  useEffect(() => {
    if (autoActive && useInfiniteScroll) startAutoDrift();
    else stopAutoDrift();
    return stopAutoDrift;
  }, [autoActive, useInfiniteScroll, startAutoDrift, stopAutoDrift]);

  // If the parent disables auto drift (e.g. tab is not focused), fully reset.
  useEffect(() => {
    if (!autoDriftEnabled) {
      clearResumeTimer();
      setManualOverride(false);
      stopAutoDrift();
    }
  }, [autoDriftEnabled, clearResumeTimer, stopAutoDrift]);

  // Cleanup timer on unmount
  useEffect(() => clearResumeTimer, [clearResumeTimer]);

  const pauseForUser = useCallback(() => {
    if (!autoDriftEnabled) return;
    clearResumeTimer();
    setManualOverride(true);
    stopAutoDrift();
  }, [autoDriftEnabled, clearResumeTimer, stopAutoDrift]);

  const scheduleResume = useCallback(() => {
    if (!autoDriftEnabled) return;
    clearResumeTimer();
    resumeTimeoutRef.current = setTimeout(() => {
      setManualOverride(false);
    }, autoResumeDelayMs);
  }, [autoDriftEnabled, clearResumeTimer, autoResumeDelayMs]);

  useImperativeHandle(
    ref,
    () => ({
      pauseAutoDrift: pauseForUser,
      resumeAutoDrift: scheduleResume,
    }),
    [pauseForUser, scheduleResume]
  );

  // Get item layout for stability
  const getItemLayout = (_: any, index: number) => ({
    length: itemCellWidth,
    offset: index * itemCellWidth,
    index,
  });

  // Key extractor - for infinite scroll, use index-based keys to handle duplicates
  const keyExtractor = (item: DisplayItem, index: number) => {
    if (useInfiniteScroll) {
      // For infinite scroll, always key by index (items repeat, including placeholders).
      return `slot-${index}`;
    }
    if (item === null) return `placeholder-${index}`;
    return item.id;
  };

  // Render carousel item
  const renderCarouselItem = ({ item, index }: { item: DisplayItem; index: number }) => {
    // With 3 visible items, the centered item is (leftmost snapped index + 1).
    const centeredIndex = Animated.add(Animated.divide(scrollX, itemCellWidth), 1);
    const distance = Animated.subtract(index, centeredIndex);

    const scale = distance.interpolate({
      inputRange: [-1, 0, 1, 2],
      outputRange: [0.94, focusedScale, 0.94, 0.94],
      extrapolate: "clamp",
    });

    const opacity = distance.interpolate({
      inputRange: [-2, -1, 0, 1, 2],
      outputRange: [1.0, 0.78, 1.0, 0.78, 1.0],
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
        {item === null ? (
          <ClosetPlaceholderCard width={itemWidth} text={placeholderText} borderRadius={16} />
        ) : (
          renderItem(item, itemWidth)
        )}
      </Animated.View>
    );
  };

  // Content container style - only horizontal padding
  const contentContainerStyle = {
    paddingHorizontal: horizontalPadding,
  };

  const snapToIntervalValue =
    displayData.length > 1
      ? autoDriftEnabled
        ? manualOverride
          ? snapInterval
          : undefined
        : snapInterval
      : undefined;

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
        snapToInterval={snapToIntervalValue}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        contentContainerStyle={contentContainerStyle}
        style={{ overflow: "visible" }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
          listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollOffsetRef.current = e.nativeEvent.contentOffset.x;
          },
        })}
        onTouchStart={pauseForUser}
        onScrollBeginDrag={pauseForUser}
        onMomentumScrollEnd={(e) => {
          handleScrollEnd(e);
          scheduleResume();
        }}
        onScrollEndDrag={(e) => {
          handleScrollEnd(e);
          scheduleResume();
        }}
        scrollEventThrottle={16}
        scrollEnabled={displayData.length > 1}
      />
    </View>
  );
});

export default EndlessRackCarousel;
