// app/features/fitpic/CornerThumbStack.tsx
import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import type { MediaItem } from './media';

export type CornerThumbStackProps = {
  /**
   * All currently selected draft items. The component will render the last 1–3.
   */
  items: MediaItem[];
  /**
   * Called when the stack is pressed (e.g., open your review drawer/sheet).
   */
  onPress: () => void;
  /**
   * Square size of the topmost thumbnail (px).
   * @default 72
   */
  size?: number;
  /**
   * Diagonal offset between stacked thumbs (px).
   * @default 10
   */
  overlap?: number;
  /**
   * Distance from screen right/bottom edges (px).
   * @default 16
   */
  cornerInset?: number;
  /**
   * Border radius for thumbnails (px).
   * @default 14
   */
  borderRadius?: number;
  /**
   * Show the small count badge.
   * @default true
   */
  showBadge?: boolean;
  /**
   * Extra style for the outer container.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Bottom-right stacked thumbnails (last 1–3 items) with a small count badge.
 * Intended to sit on top of the camera surface. Press opens the drawer.
 */
const CornerThumbStack: React.FC<CornerThumbStackProps> = ({
  items,
  onPress,
  size = 72,
  overlap = 10,
  cornerInset = 16,
  borderRadius = 14,
  showBadge = true,
  style,
}) => {
  const count = items?.length ?? 0;

  // Nothing selected? Hide.
  if (!count) return null;

  // Take the last 1–3, preserve order oldest->newest so newest is rendered on top.
  const lastThree = useMemo(() => items.slice(-3), [items]);

  // Container is slightly larger to account for the visible offsets.
  const containerSize = size + overlap * 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open selected media"
      onPress={onPress}
      hitSlop={12}
      style={[
        styles.root,
        {
          right: cornerInset,
          bottom: cornerInset,
          width: containerSize,
          height: containerSize,
        },
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.stackArea}>
        {lastThree.map((m, i) => {
          // Oldest of the three is i=0 (goes furthest up/left), newest is last (i=2) with smallest offset.
          const depth = lastThree.length - 1 - i; // 2,1,0 for 3 items
          const offset = depth * overlap;

          return (
            <View
              key={m.id}
              style={[
                styles.thumbWrap,
                {
                  width: size,
                  height: size,
                  right: offset,
                  bottom: offset,
                  borderRadius,
                },
              ]}
            >
              {m.type === 'photo' ? (
                <Image
                  source={{ uri: m.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.videoStub}>
                  <Text style={styles.videoGlyph}>▶︎</Text>
                </View>
              )}

              {/* Soft outline to keep visibility over camera feed */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: 'rgba(255,255,255,0.7)',
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {showBadge && (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    zIndex: 50,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  stackArea: {
    position: 'absolute',
    inset: 0,
  },
  thumbWrap: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#111',
    // Subtle depth
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  videoStub: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
  },
  videoGlyph: {
    fontSize: 22,
    color: '#fff',
    opacity: 0.9,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default React.memo(CornerThumbStack);
