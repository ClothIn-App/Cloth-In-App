import React, { useMemo } from "react";
import { View, ScrollView, useWindowDimensions, RefreshControl, RefreshControlProps } from "react-native";

type MasonryGridProps<T> = {
  data: T[];
  columns?: number;          // default 2
  gutter?: number;           // spacing between tiles (px)
  contentPadding?: number;   // horizontal padding on the container (px)
  getItemHeight: (item: T, columnWidth: number) => number;
  renderItem: (item: T, columnWidth: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
};

export default function MasonryGrid<T>({
  data,
  columns = 2,
  gutter = 8,
  contentPadding = 12,
  getItemHeight,
  renderItem,
  keyExtractor,
  refreshControl,
}: MasonryGridProps<T>) {
  // Portrait-only assumption is fine; this will still work if rotation gets enabled later.
  const { width: screenWidth } = useWindowDimensions();

  const columnWidth = useMemo(() => {
    const usable = screenWidth - contentPadding * 2 - gutter * (columns - 1);
    return Math.floor(usable / columns);
  }, [screenWidth, columns, gutter, contentPadding]);

  // Distribute items into columns using "shortest-column-first" packing.
  const columnsPacked = useMemo(() => {
    const heights = Array(columns).fill(0) as number[];
    const cols: { key: string; node: React.ReactNode; height: number }[][] =
      Array.from({ length: columns }, () => []);

    data.forEach((item, i) => {
      const hRaw = getItemHeight(item, columnWidth);
      const h = Number.isFinite(hRaw) && hRaw > 0 ? hRaw : columnWidth; // fallback
      const targetIdx = heights.indexOf(Math.min(...heights));

      cols[targetIdx].push({
        key: keyExtractor(item, i),
        node: renderItem(item, columnWidth),
        height: h,
      });
      heights[targetIdx] += h + gutter; // include vertical spacing
    });

    return cols;
  }, [data, columnWidth, columns, gutter, getItemHeight, renderItem, keyExtractor]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      contentContainerStyle={{
        paddingLeft: contentPadding,
        paddingRight: contentPadding,
        paddingTop: gutter,
        paddingBottom: gutter,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {columnsPacked.map((col, idx) => (
          <View
            key={`masonry-col-${idx}`}
            style={{
              width: columnWidth,
              marginLeft: idx === 0 ? 0 : gutter, // horizontal gutter between columns
            }}
          >
            {col.map(({ key, node }, j) => (
              <View key={key} style={{ marginBottom: j === col.length - 1 ? 0 : gutter }}>
                {node}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
