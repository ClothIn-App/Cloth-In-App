// File: src/create/post/photogrid.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useDrafts } from './../draftcontext';

export type PhotoGridProps = {
  /** Optional override of the ordered, selected asset IDs (photos only). Defaults to DraftsContext.selectedIds. */
  selectedIds?: string[];
  /** Optional handler for opening a preview when tapping a photo. */
  onOpenPreview?: (id: string) => void;
  /** Optional remove handler. Defaults to DraftsContext.removeSelected. */
  removeSelected?: (id: string) => void;
  /** Optional reorder handler. Defaults to DraftsContext.setSelectedOrder. */
  setSelectedOrder?: (ids: string[]) => void;
  /** Optional handler for "+" placeholders. If omitted, falls back to router.back() to return to modal 1. */
  onAddPress?: () => void;
  /** Notifies parent when a drag begins/ends, e.g. to disable ScrollView. */
  onDragStateChange?: (dragging: boolean) => void;
};

type AnyItem = {
  id: string;
  uri?: string;
  type?: string;
  mediaType?: string;
  kind?: string;
};

const SLOTS = 5;

const isVideo = (item?: AnyItem | null) => {
  const t = (item?.type ?? item?.mediaType ?? item?.kind ?? '').toLowerCase();
  return t === 'video';
};

// Swap items at indices a and b (new array)
function swapIndex<T>(arr: T[], a: number, b: number): T[] {
  if (a === b) return arr.slice();
  const next = arr.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

// Resolve a displayable file URI, handling iOS ph:// and Android content:// cases.
async function resolveAssetUri(id: string, raw?: string | null): Promise<string | null> {
  if (raw && !raw.startsWith('ph://') && !raw.startsWith('content://')) return raw;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id);
    return info.localUri ?? info.uri ?? null;
  } catch {
    return null;
  }
}

type SlotRect = { x: number; y: number; w: number; h: number };

function computeSlotRects(containerWidth: number): SlotRect[] {
  // 4 columns, 2 rows; left 2x2 occupied by cover, right 2x2 are four small squares.
  const s = containerWidth / 4; // size of one small square
  return [
    { x: 0 * s, y: 0 * s, w: 2 * s, h: 2 * s }, // slot 0: Cover (2x2)
    { x: 2 * s, y: 0 * s, w: 1 * s, h: 1 * s }, // slot 1
    { x: 3 * s, y: 0 * s, w: 1 * s, h: 1 * s }, // slot 2
    { x: 2 * s, y: 1 * s, w: 1 * s, h: 1 * s }, // slot 3
    { x: 3 * s, y: 1 * s, w: 1 * s, h: 1 * s }, // slot 4
  ];
}

const Thumb = React.memo(function Thumb({
  id,
  uri,
  orderIndex,
  isCover,
  onPress,
  onRemove,
  onLongPress,
  dimWhileDragging,
}: {
  id: string;
  uri: string | null;
  orderIndex: number;
  isCover: boolean;
  onPress?: (id: string) => void;
  onRemove: (id: string) => void;
  onLongPress?: () => void;
  dimWhileDragging?: boolean;
}) {
  return (
    <Pressable
      style={[StyleSheet.absoluteFill, { borderRadius: 10, overflow: 'hidden' }]}
      onPress={onPress ? () => onPress(id) : undefined}
      onLongPress={onLongPress}
      delayLongPress={160}
    >
      <View style={[StyleSheet.absoluteFill, styles.thumbBg, isCover && styles.coverRing]} />
      {uri ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill]}
          contentFit="cover"
          recyclingKey={id}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Text style={styles.fallbackText}>Photo</Text>
        </View>
      )}

      {/* Cover chip */}
      {isCover && (
        <View style={styles.coverChip}>
          <Text style={styles.coverChipText}>Cover</Text>
        </View>
      )}

      {/* Order badge */}
      <View style={styles.orderBadge}>
        <Text style={styles.orderText}>{orderIndex + 1}</Text>
      </View>

      {/* Remove button */}
      <Pressable onPress={() => onRemove(id)} style={styles.removeBtn} hitSlop={8}>
        <Text style={styles.removeX}>✕</Text>
      </Pressable>

      {dimWhileDragging && <View style={[StyleSheet.absoluteFill, styles.dragDim]} />}
    </Pressable>
  );
});

const Placeholder = React.memo(function Placeholder({
  label,
  onPress,
  isCover,
}: {
  label: string;
  onPress: () => void;
  isCover?: boolean;
}) {
  return (
    <Pressable style={[StyleSheet.absoluteFill]} onPress={onPress}>
      <View style={[StyleSheet.absoluteFill, styles.placeholder, isCover && styles.coverRing]}>
        <Text style={styles.plusText}>＋</Text>
        <Text style={styles.addText}>{label}</Text>
      </View>
    </Pressable>
  );
});

export default function PhotoGrid({
  selectedIds: selectedIdsProp,
  onOpenPreview,
  removeSelected: removeSelectedProp,
  setSelectedOrder: setSelectedOrderProp,
  onAddPress,
  onDragStateChange,
}: PhotoGridProps) {
  const drafts = useDrafts();
  const router = useRouter();

  const selectedIds = selectedIdsProp ?? drafts.selectedIds;
  const removeSelected = removeSelectedProp ?? drafts.removeSelected;
  const setSelectedOrder = setSelectedOrderProp ?? drafts.setSelectedOrder;

  // Resolve items (id -> asset)
  const idToItem = useMemo(() => {
    const map = new Map<string, AnyItem>();
    for (const it of drafts.items as AnyItem[]) map.set(it.id, it);
    return map;
  }, [drafts.items]);

  // Photos only, preserving selection order
  const allPhotos = useMemo(
    () => selectedIds.filter((id) => !isVideo(idToItem.get(id))),
    [selectedIds, idToItem]
  );

  // Display only the first 5 photos in this grid
  const displayIds = useMemo(() => allPhotos.slice(0, SLOTS), [allPhotos]);

  // Resolve URIs for thumbnails
  const [uris, setUris] = useState<Record<string, string | null>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const entries = await Promise.all(
        displayIds.map(async (id) => [id, await resolveAssetUri(id, idToItem.get(id)?.uri)] as const)
      );
      if (alive) {
        const next: Record<string, string | null> = {};
        for (const [id, uri] of entries) next[id] = uri;
        setUris(next);
      }
    })();
    return () => {
      alive = false;
    };
  }, [displayIds, idToItem]);

  // Layout and slot geometry
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);
  const rects = useMemo(() => (width > 0 ? computeSlotRects(width) : []), [width]);
  const unit = width > 0 ? width / 4 : 0;

  // Drag state
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const draggingIndexRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const currentPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const proxySizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 }); // size of drag proxy (cover shrinks)

  const beginDrag = useCallback(
    (index: number) => {
      if (!rects.length || index >= displayIds.length) return;
      draggingIndexRef.current = index;
      setDraggingIndex(index);

      const r = rects[index];
      // Shrink cover to unit square for proxy; others remain their rect size.
      const w = index === 0 ? unit : r.w;
      const h = index === 0 ? unit : r.h;
      proxySizeRef.current = { w, h };

      const startX = index === 0 ? r.x + (r.w - w) / 2 : r.x;
      const startY = index === 0 ? r.y + (r.h - h) / 2 : r.y;

      dragStartRef.current = { x: startX, y: startY };
      pan.stopAnimation();
      pan.setValue({ x: startX, y: startY });
      currentPos.current = { x: startX, y: startY };

      onDragStateChange?.(true);
    },
    [rects, displayIds.length, pan, unit, onDragStateChange]
  );

  const commitSwap = useCallback(
    (a: number, b: number) => {
      if (a === b) return;
      const swapped = swapIndex(allPhotos, a, b);
      const photoSet = new Set(swapped);
      const others = selectedIds.filter((id) => !photoSet.has(id));
      setSelectedOrder([...swapped, ...others]);
    },
    [allPhotos, selectedIds, setSelectedOrder]
  );

  const endDrag = useCallback(
    (targetIndex: number | null) => {
      const from = draggingIndexRef.current;
      draggingIndexRef.current = null;

      const reset = () => {
        setDraggingIndex(null);
        onDragStateChange?.(false);
      };

      if (from == null) return reset();

      const count = displayIds.length;
      const boundedTarget =
        targetIndex == null ? from : Math.max(0, Math.min(count - 1, targetIndex));

      const targetRect = rects[boundedTarget];
      if (!targetRect) {
        reset();
        return;
      }

      // Snap animation of the proxy to the target rect center-aligned to its size.
      const { w, h } = proxySizeRef.current;
      const snapX = targetRect.x + (targetRect.w - w) / 2;
      const snapY = targetRect.y + (targetRect.h - h) / 2;

      Animated.timing(pan, {
        toValue: { x: snapX, y: snapY },
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        commitSwap(from, boundedTarget);
        reset();
      });
    },
    [rects, pan, commitSwap, displayIds.length, onDragStateChange]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => draggingIndexRef.current != null,
      onMoveShouldSetPanResponder: () => draggingIndexRef.current != null,
      onMoveShouldSetPanResponderCapture: () => draggingIndexRef.current != null,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_evt, gesture) => {
        if (draggingIndexRef.current == null) return;
        const start = dragStartRef.current;
        const x = start.x + gesture.dx;
        const y = start.y + gesture.dy;
        currentPos.current = { x, y };
        pan.setValue({ x, y });
      },
      onPanResponderRelease: () => {
        const from = draggingIndexRef.current;
        const count = displayIds.length;
        if (from == null || !rects.length || !count) return endDrag(null);

        const { w, h } = proxySizeRef.current;
        const { x, y } = currentPos.current;
        const cx = x + w / 2;
        const cy = y + h / 2;

        let best = from;
        let bestD = Number.POSITIVE_INFINITY;
        for (let i = 0; i < count; i++) {
          const r = rects[i];
          const rx = r.x + r.w / 2;
          const ry = r.y + r.h / 2;
          const d = (cx - rx) * (cx - rx) + (cy - ry) * (cy - ry);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        endDrag(best);
      },
      onPanResponderTerminate: () => endDrag(null),
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const handleAddPress = useCallback(() => {
    if (onAddPress) onAddPress();
    else router.back(); // Best-effort: go back to modal 1 (fitpic_media)
  }, [onAddPress, router]);

  return (
    <View onLayout={onLayout} style={styles.container} {...panResponder.panHandlers}>
      {/* Fixed 2:1 grid area */}
      <View style={styles.gridArea}>
        {rects.map((r, slotIndex) => {
          const hasItem = slotIndex < displayIds.length;
          const isCover = slotIndex === 0;

          // Base absolutely-positioned frame for the slot
          const frameStyle = {
            position: 'absolute' as const,
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
          };

          if (hasItem) {
            const id = displayIds[slotIndex];
            const isDraggingThis = draggingIndex === slotIndex;
            return (
              <View key={`slot-${slotIndex}`} style={frameStyle} pointerEvents={isDraggingThis ? 'none' : 'auto'}>
                <Thumb
                  id={id}
                  uri={uris[id] ?? null}
                  orderIndex={slotIndex}
                  isCover={isCover}
                  onPress={onOpenPreview}
                  onRemove={removeSelected}
                  onLongPress={() => beginDrag(slotIndex)}
                  dimWhileDragging={false}
                />
              </View>
            );
          }

          // Placeholder if fewer than five photos
          return (
            <View key={`slot-${slotIndex}`} style={frameStyle}>
              <Placeholder
                label={slotIndex === 0 ? 'Add Cover' : 'Add Photo'}
                onPress={handleAddPress}
                isCover={isCover}
              />
            </View>
          );
        })}

        {/* Drag overlay (rendered above everything while dragging) */}
        {draggingIndex != null && rects[draggingIndex] && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: proxySizeRef.current.w || rects[draggingIndex].w,
                height: proxySizeRef.current.h || rects[draggingIndex].h,
                transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: 1.03 }],
                zIndex: 10,
              },
              styles.dragShadow,
            ]}
            pointerEvents="none"
          >
            <Thumb
              id={displayIds[draggingIndex]}
              uri={uris[displayIds[draggingIndex]] ?? null}
              orderIndex={draggingIndex}
              isCover={draggingIndex === 0}
              onPress={onOpenPreview}
              onRemove={removeSelected}
              dimWhileDragging
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gridArea: {
    width: '100%',
    aspectRatio: 2, // 4 columns of squares => total height = width/2
  },
  thumbBg: {
    backgroundColor: '#f2f2f2',
  },
  coverRing: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.75)',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9e9e9',
  },
  fallbackText: {
    fontSize: 12,
    color: '#666',
  },
  coverChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coverChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  orderBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  orderText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeX: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  placeholder: {
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c7c7c7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  plusText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    color: '#444',
  },
  addText: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  dragDim: {
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  dragShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
});