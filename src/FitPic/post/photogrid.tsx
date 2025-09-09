// File: src/FitPic/post/components/PhotoGrid.tsx
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useDrafts } from './../draftcontext';

export type PhotoGridProps = {
  /**
   * Ordered list of selected asset IDs to display (photos only).
   * If omitted, falls back to DraftsContext.selectedIds.
   */
  selectedIds?: string[];
  /** Open a full-screen preview for the tapped photo id. */
  onOpenPreview: (id: string) => void;
  /** Remove the given id from selection. If omitted, uses DraftsContext.removeSelected. */
  removeSelected?: (id: string) => void;
  /** Replace the current selection order. If omitted, uses DraftsContext.setSelectedOrder. */
  setSelectedOrder?: (ids: string[]) => void;
};

type AnyItem = {
  id: string;
  uri?: string;
  // support a few common shapes we've used elsewhere
  type?: string;        // 'photo' | 'video'
  mediaType?: string;   // 'photo' | 'video'
  kind?: string;        // 'photo' | 'video'
};

function moveIndex(ids: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return ids;
  const next = ids.slice();
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

const isVideo = (item?: AnyItem | null) => {
  const t = (item?.type ?? item?.mediaType ?? item?.kind ?? '').toLowerCase();
  return t === 'video';
};

// Resolves an asset's displayable URI, handling iOS `ph://` and Android `content://`
async function resolveAssetUri(id: string, raw?: string | null): Promise<string | null> {
  if (raw && !raw.startsWith('ph://') && !raw.startsWith('content://')) {
    return raw;
  }
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id);
    return info.localUri ?? info.uri ?? null;
  } catch {
    return null;
  }
}

// A tiny cell component so we can safely use hooks to resolve URIs.
const GridCell = React.memo(function GridCell({
  id,
  index,
  asset,
  cover,
  isLast,
  onOpenPreview,
  onRemove,
  onMove,
}: {
  id: string;
  index: number;
  asset?: AnyItem;
  cover: boolean;
  isLast: boolean;
  onOpenPreview: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const next = await resolveAssetUri(id, asset?.uri);
      if (alive) setUri(next);
    })();
    return () => {
      alive = false;
    };
  }, [id, asset?.uri]);

  return (
    <View style={styles.cell}>
      <Pressable
        style={[styles.thumb, cover && styles.coverBorder]}
        onPress={() => onOpenPreview(id)}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="cover"
            recyclingKey={id}
          />
        ) : (
          <View style={[styles.image, styles.fallback]}>
            <Text style={styles.fallbackText}>ID {id}</Text>
          </View>
        )}

        {/* Cover badge */}
        {cover && (
          <View style={styles.coverBadge}>
            <Text style={styles.coverText}>Cover</Text>
          </View>
        )}

        {/* Remove pill (top-right) */}
        <Pressable onPress={() => onRemove(id)} style={styles.removePill} hitSlop={6}>
          <Text style={styles.removeText}>✕</Text>
        </Pressable>

        {/* Up/Down controls (bottom-right) */}
        <View style={styles.moveGroup}>
          <Pressable
            disabled={index === 0}
            onPress={() => onMove(index, -1)}
            style={[styles.moveBtn, index === 0 && styles.moveDisabled]}
            hitSlop={6}
          >
            <Text style={styles.moveText}>↑</Text>
          </Pressable>
          <Pressable
            disabled={isLast}
            onPress={() => onMove(index, +1 as 1)}
            style={[styles.moveBtn, isLast && styles.moveDisabled]}
            hitSlop={6}
          >
            <Text style={styles.moveText}>↓</Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
});

export default function PhotoGrid(props: PhotoGridProps) {
  const drafts = useDrafts();
  const selectedIds = props.selectedIds ?? drafts.selectedIds;
  const removeSelected = props.removeSelected ?? drafts.removeSelected;
  const setSelectedOrder = props.setSelectedOrder ?? drafts.setSelectedOrder;

  // Build quick id -> item map so we can fetch URIs for thumbs.
  const idToItem = useMemo(() => {
    const map = new Map<string, AnyItem>();
    for (const it of drafts.items as AnyItem[]) map.set(it.id, it);
    return map;
  }, [drafts.items]);

  // Filter to PHOTOS only, preserving order.
  const photoIds = useMemo(
    () => selectedIds.filter(id => !isVideo(idToItem.get(id))),
    [selectedIds, idToItem]
  );

  const handleMove = useCallback(
    (index: number, dir: -1 | 1) => {
      const nextIndex = index + dir;
      if (nextIndex < 0 || nextIndex >= photoIds.length) return;

      const reorderedPhotos = moveIndex(photoIds, index, nextIndex);

      // Rebuild the full selected order, preserving any videos (if present)
      const photoQueue = new Map<string, number>();
      reorderedPhotos.forEach((id, i) => photoQueue.set(id, i));
      const rebuilt = selectedIds
        .slice()
        .sort((a, b) => {
          const ia = photoQueue.get(a);
          const ib = photoQueue.get(b);
          if (ia === undefined && ib === undefined) return 0;
          if (ia === undefined) return 1;
          if (ib === undefined) return -1;
          return ia - ib;
        });

      setSelectedOrder(rebuilt);
    },
    [photoIds, selectedIds, setSelectedOrder]
  );

  const renderItem = useCallback(
    ({ item: id, index }: { item: string; index: number }) => {
      const asset = idToItem.get(id);
      const cover = index === 0;
      const isLast = index === photoIds.length - 1;

      return (
        <GridCell
          id={id}
          index={index}
          asset={asset}
          cover={cover}
          isLast={isLast}
          onOpenPreview={props.onOpenPreview}
          onRemove={removeSelected}
          onMove={handleMove}
        />
      );
    },
    [idToItem, photoIds.length, removeSelected, handleMove, props]
  );

  return (
    <FlatList
      data={photoIds}
      keyExtractor={(id) => id}
      numColumns={4}
      renderItem={renderItem}
      scrollEnabled={false}
      contentContainerStyle={styles.listContent as ViewStyle}
      columnWrapperStyle={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  row: {
    gap: 8,
    paddingBottom: 8,
  },
  cell: {
    flex: 1,
  },
  thumb: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 11,
    color: '#666',
  },
  coverBorder: {
    borderWidth: 3,
    borderColor: '#111',
  },
  coverBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  removePill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  moveGroup: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    gap: 4,
    alignItems: 'center',
  },
  moveBtn: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moveDisabled: {
    opacity: 0.35,
  },
  moveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
});