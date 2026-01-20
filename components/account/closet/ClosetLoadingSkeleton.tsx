import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SkeletonBlock from "../../common/SkeletonBlock";

export default function ClosetLoadingSkeleton() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Mirror ClosetTab layout
  const sectionHeaderLeftPad = 24;
  const sectionHeaderRightPad = 12;
  const contentTopPad = 16;

  // Mirror EndlessRackCarousel math (defaults used by ClosetTab)
  const carouselHorizontalPadding = 12;
  const itemSpacing = 14;
  const available = screenWidth - carouselHorizontalPadding * 2;
  const itemWidth = (available - itemSpacing * 2) / 3;
  const cardHeight = itemWidth * 1.15;

  // Mirror rack grid math in ClosetTab
  const gridHorizontalPadding = 24;
  const gridColumnGap = 12;
  const tileWidth =
    (screenWidth - gridHorizontalPadding * 2 - gridColumnGap) / 2;

  const rackTileHeight = useMemo(() => {
    // Roughly match RackStackTile’s bubble + stacked cards
    // (it computes internal height from width; we approximate to keep skeleton stable)
    const bubblePadding = 24;
    const contentWidth = tileWidth - bubblePadding;
    const innerCardWidth = Math.round(contentWidth * 0.86);
    const innerCardHeight = innerCardWidth * 1.15;
    const containerHeight = Math.round(innerCardHeight + 18);
    // header (~24) + stack container + padding (12*2)
    return 12 + 24 + 10 + containerHeight + 12;
  }, [tileWidth]);

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: contentTopPad, paddingBottom: 16 + insets.bottom }]}>
        {/* Section header skeleton (title + icons) */}
        <View
          style={[
            styles.sectionHeader,
            { paddingLeft: sectionHeaderLeftPad, paddingRight: sectionHeaderRightPad },
          ]}
        >
          <SkeletonBlock width={140} height={20} borderRadius={10} />
          <View style={styles.headerRight}>
            <SkeletonBlock width={22} height={22} borderRadius={11} />
            <View style={{ width: 10 }} />
            <SkeletonBlock width={22} height={22} borderRadius={11} />
          </View>
        </View>

        {/* Carousel row skeleton */}
        <View style={{ paddingHorizontal: carouselHorizontalPadding }}>
          <View style={{ flexDirection: "row" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={`card-${i}`}
                style={{ marginHorizontal: itemSpacing / 2 }}
              >
                <SkeletonBlock width={itemWidth} height={cardHeight} borderRadius={16} />
              </View>
            ))}
          </View>
        </View>

        {/* Rack grid skeleton */}
        <View style={{ height: 28 }} />
        <View style={[styles.racksGrid, { paddingHorizontal: gridHorizontalPadding }]}>
          {Array.from({ length: 4 }).map((_, idx) => {
            const isLeftColumn = idx % 2 === 0;
            return (
              <View
                key={`tile-${idx}`}
                style={{
                  width: tileWidth,
                  marginRight: isLeftColumn ? gridColumnGap : 0,
                  marginBottom: 28,
                }}
              >
                <SkeletonBlock width={tileWidth} height={rackTileHeight} borderRadius={18} />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  racksGrid: {
    paddingTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

