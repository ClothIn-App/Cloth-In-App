import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ClosetProductCard from "./ClosetProductCard";
import ClosetPlaceholderCard from "./ClosetPlaceholderCard";

type StackItem = {
  id: string;
  source: ImageSourcePropType;
};

type Props = {
  title: string;
  width: number;
  items: StackItem[];
  maxPreviewCount?: number; // default 3
  onPressExpand?: () => void;
};

export default function RackStackTile({
  title,
  width,
  items,
  maxPreviewCount = 3,
  onPressExpand = () => {},
}: Props) {
  const previewItems = useMemo(() => items.slice(0, maxPreviewCount), [items, maxPreviewCount]);
  const previewCount = previewItems.length;

  // Make the stack slightly smaller than the tile so overlaps don't clip.
  const cardWidth = Math.round(width * 0.86);
  const cardHeight = cardWidth * 1.15;
  const containerHeight = Math.round(cardHeight + 18);

  // Keep the stack anchored: the "front" card position should be identical
  // whether we have 1, 2, or 3 items. We simply omit missing back cards.
  const offsets = useMemo(() => {
    const full = [
      { x: 24, y: 10 }, // back
      { x: 12, y: 5 }, // mid
      { x: 0, y: 0 }, // front
    ];
    return full;
  }, [previewCount]);

  // Anchor against the full 3-card stack width so shorter stacks don't re-center.
  const maxOffsetX = 24;
  const baseLeft = (width - cardWidth) / 2 - maxOffsetX / 2;
  const baseTop = (containerHeight - cardHeight) / 2;

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={onPressExpand}
          accessibilityRole="button"
          accessibilityLabel={`Expand ${title}`}
          hitSlop={10}
          style={styles.expandButton}
        >
          <Ionicons name="expand-outline" size={18} color="#11181C" />
        </Pressable>
      </View>

      <View style={[styles.stackContainer, { height: containerHeight }]}>
        {/* Always render a 3-layer stack. Missing items become cutout placeholders. */}
        {offsets.map((offset, i) => {
          const start = 3 - Math.min(3, previewCount);
          const itemIndex = i - start;
          const it = itemIndex >= 0 ? previewItems[itemIndex] : null;
          return (
            <View
              key={it ? it.id : `placeholder-${i}`}
              style={{
                position: "absolute",
                left: baseLeft + offset.x,
                top: baseTop + offset.y,
              }}
            >
              {it ? (
                <ClosetProductCard width={cardWidth} source={it.source} borderRadius={16} />
              ) : (
                <ClosetPlaceholderCard width={cardWidth} text="" borderRadius={16} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    maxWidth: "92%",
  },
  expandButton: {
    marginLeft: 8,
  },
  stackContainer: {
    width: "100%",
    overflow: "visible",
  },
});

