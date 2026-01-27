import React, { useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ImageSourcePropType, Animated } from "react-native";
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
  onPress?: () => void;
  highlighted?: boolean;
};

export default function RackStackTile({
  title,
  width,
  items,
  maxPreviewCount = 3,
  onPressExpand = () => {},
  onPress,
  highlighted = false,
}: Props) {
  const previewItems = useMemo(() => items.slice(0, maxPreviewCount), [items, maxPreviewCount]);
  const previewCount = previewItems.length;
  
  // Animated scale for highlight effect
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: highlighted ? 1.04 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [highlighted, scaleAnim]);

  // Make the stack slightly smaller than the tile so overlaps don't clip.
  // Account for bubble padding (12px on each side = 24px total)
  const bubblePadding = 24;
  const contentWidth = width - bubblePadding;
  const cardWidth = Math.round(contentWidth * 0.86);
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
  const baseLeft = (contentWidth - cardWidth) / 2 - maxOffsetX / 2;
  const baseTop = (containerHeight - cardHeight) / 2;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pressableContainer,
        pressed && onPress && styles.pressablePressed,
      ]}
    >
      <Animated.View
        style={[
          styles.bubbleContainer,
          { width },
          {
            transform: [{ scale: scaleAnim }],
          },
          highlighted ? styles.bubbleHighlighted : styles.bubbleDefault,
        ]}
      >
        <View style={styles.container}>
        <View style={styles.header}>
          <Text 
            style={styles.title} 
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.7}
          >
            {title}
          </Text>
          <Pressable
            onPress={onPressExpand}
            accessibilityRole="button"
            accessibilityLabel={`${title} options`}
            // Make scroll gestures win over accidental presses.
            pressRetentionOffset={{ top: 0, left: 0, right: 0, bottom: 0 }}
            hitSlop={6}
            style={styles.expandButton}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#11181C" />
          </Pressable>
        </View>

        <View style={[styles.stackContainer, { height: containerHeight }]}>
          {/* Always render a 3-layer stack. Missing items become cutout placeholders. */}
          {/* Front card (i === 2) shows the first item (most recent), back card (i === 0) shows the last item */}
          {offsets.map((offset, i) => {
            const start = 3 - Math.min(3, previewCount);
            const rawIndex = i - start;
            // Reverse the order so first item (most recent) goes to front card (i === 2)
            const itemIndex = rawIndex >= 0 ? (previewCount - 1 - rawIndex) : -1;
            const it = itemIndex >= 0 && itemIndex < previewItems.length ? previewItems[itemIndex] : null;
            // Front card (i === 2) should show "Add Products" text when there are 0 products
            const isFrontCard = i === 2;
            const shouldShowAddText = previewCount === 0 && isFrontCard;
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
                  <ClosetPlaceholderCard 
                    width={cardWidth} 
                    text={shouldShowAddText ? "Add Products to This Rack" : ""} 
                    borderRadius={16} 
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableContainer: {
    overflow: "visible",
  },
  pressablePressed: {
    opacity: 0.7,
  },
  bubbleContainer: {
    borderRadius: 18,
    padding: 12,
    overflow: "visible",
  },
  bubbleDefault: {
    borderWidth: 1.5,
    borderColor: "#E3E3E7",
  },
  bubbleHighlighted: {
    borderWidth: 2.5,
    borderColor: "#11181C",
  },
  container: {
    overflow: "visible",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingLeft: 8,
    minHeight: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  expandButton: {
    flexShrink: 0,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 1 }],
  },
  stackContainer: {
    width: "100%",
    overflow: "visible",
  },
});

