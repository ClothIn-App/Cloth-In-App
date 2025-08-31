// app/features/fitpic/CornerThumbStack.tsx
import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Image as ImageExpo } from 'expo-image'; // ← swap in expo-image
import type { MediaItem } from './camera/media';

export type CornerThumbStackProps = {
  items: MediaItem[];
  onPress: () => void;
  size?: number;
  overlap?: number;
  cornerInset?: number;
  borderRadius?: number;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

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
  if (!count) return null;

  const lastThree = useMemo(() => items.slice(-3), [items]);
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
          const depth = lastThree.length - 1 - i;
          const offset = depth * overlap;

          return (
            <View
              key={String(
                m.id ??
                  (m as any).uid ??
                  m.uri ??
                  `${m.type || 'media'}-${(m as any).createdAt || ''}-${i}`
              )}
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
              <ImageExpo
                source={{ uri: (m as any).thumbnailUri ?? m.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"             // ← replace resizeMode
              />
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
        <View
          pointerEvents="none"
          style={[
            styles.badge,
            { top: overlap * 2 - 4 },
          ]}
        >
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
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
