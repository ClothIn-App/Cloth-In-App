// components/product-modal/ProductReactionsRow.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Reactions, ReactionKey } from "../../src/types/feed";

type Props = {
  reactions: Reactions; // expects { counts: Record<ReactionKey, number> }
  onChange: (reactions: Reactions) => void;
  onShare?: () => void;
  /** Optional: if you already track user's choice outside, pass it in */
  initialSelected?: ReactionKey | null;
  /** Optional: controlled saved/bookmark state */
  isSaved?: boolean;
  /** Optional: callback when save state changes */
  onToggleSave?: (nextSaved: boolean) => void;
  /** Optional: product ID for sharing context */
  productId?: string;
};

/**
 * Order & icon mapping
 */
const REACTION_ORDER: ReactionKey[] = ["LIKE", "THUMBS_UP", "FIRE", "DISLIKE"] as const;

const REACTION_ICONS: Record<
  ReactionKey,
  { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap; activeColor: string }
> = {
  LIKE: { outline: "heart-outline", filled: "heart", activeColor: "#FF3B30" }, // iOS red
  THUMBS_UP: { outline: "thumbs-up-outline", filled: "thumbs-up", activeColor: "#FFD60A" }, // emoji yellow
  FIRE: { outline: "flame-outline", filled: "flame", activeColor: "#FF6B35" }, // requested orange
  DISLIKE: { outline: "thumbs-down-outline", filled: "thumbs-down", activeColor: "#FFD60A" }, // emoji yellow
};

export function ProductReactionsRow({
  reactions,
  onChange,
  onShare,
  initialSelected = null,
  isSaved: isSavedProp,
  onToggleSave,
  productId,
}: Props) {
  // Single-reaction selection (client-only, optimistic)
  const [selected, setSelected] = useState<ReactionKey | null>(initialSelected);
  
  // Save/bookmark state (uncontrolled by default, controlled if isSaved prop is provided)
  const [saved, setSaved] = useState<boolean>(isSavedProp ?? false);
  
  // Sync internal state with controlled prop if provided
  useEffect(() => {
    if (isSavedProp !== undefined) {
      setSaved(isSavedProp);
    }
  }, [isSavedProp]);

  // Small pop animation per reaction
  const pops = useMemo(
    () =>
      Object.fromEntries(
        REACTION_ORDER.map((k) => [k, new Animated.Value(1)])
      ) as Record<ReactionKey, Animated.Value>,
    []
  );

  const animatePop = (key: ReactionKey) => {
    const v = pops[key];
    v.stopAnimation();
    Animated.sequence([
      Animated.timing(v, { toValue: 1.15, duration: 110, useNativeDriver: true }),
      Animated.spring(v, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  };

  const handleReactionPress = (key: ReactionKey) => {
    const currentCounts = reactions.counts;
    const nextCounts = { ...currentCounts };

    if (selected === key) {
      // Toggle OFF same reaction
      nextCounts[key] = Math.max(0, (nextCounts[key] ?? 0) - 1);
      setSelected(null);
    } else {
      // Switch from previous to new (only one allowed)
      if (selected) {
        nextCounts[selected] = Math.max(0, (nextCounts[selected] ?? 0) - 1);
      }
      nextCounts[key] = (nextCounts[key] ?? 0) + 1;
      setSelected(key);
    }

    animatePop(key);
    onChange({ counts: nextCounts });
  };

  const handleSavePress = () => {
    const next = !saved;
    setSaved(next);
    if (onToggleSave) {
      onToggleSave(next);
    }
  };

  const handleShare = async () => {
    if (onShare) return onShare();
    try {
      await Share.share({
        message: "Check out this product!",
        ...(Platform.OS === "ios" && { url: "https://clothin.app" }),
      });
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.container}>
      {/* Reactions (left) */}
      <View style={styles.reactionsContainer}>
        {REACTION_ORDER.map((key) => {
          const count = reactions.counts[key] ?? 0;
          const isActive = selected === key;
          const iconConf = REACTION_ICONS[key];
          const color = isActive ? iconConf.activeColor : "#222";

          return (
            <TouchableOpacity
              key={key}
              style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
              onPress={() => handleReactionPress(key)}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: pops[key] }] }}>
                <Ionicons
                  name={isActive ? iconConf.filled : iconConf.outline}
                  size={22}
                  color={color}
                />
              </Animated.View>
              {count > 0 && (
                <Text style={[styles.count, isActive && { color }]}>{count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Save & Share (right) */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSavePress}
          activeOpacity={0.8}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={saved ? "#111" : "#222"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6e6e6",
    backgroundColor: "transparent",
  },
  reactionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  reactionButtonActive: {
    backgroundColor: "#f7f7f7",
  },
  count: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    minWidth: 0,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    padding: 8,
    borderRadius: 18,
    marginRight: 4,
  },
  shareButton: {
    padding: 8,
    borderRadius: 18,
  },
});
