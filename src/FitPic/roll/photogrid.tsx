// app/src/FitPic/cameraroll/PhotoGrid.tsx
import type { FlatListProps, ListRenderItem } from 'react-native';
import React, { memo, useMemo, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import type { AssetLite } from './types';
import { COLS, getTileSize } from './types';


type PhotoGridProps = {
  assets: AssetLite[];                 // useCameraRoll().assets (photos only upstream)
  selectedIds: string[];               // useSelectionSync().selectedIds
  onToggle(asset: AssetLite): void;    // useSelectionSync().toggle
  onJumpToCamera(): void;              // first-cell press
  onEndReachMore(): void;              // load next page
  hasNextPage: boolean;
  loading: boolean;                    // show skeletons
  onScrollY(y: number): void;          // to collapse preview panel
  skeletonCount?: number;              // pass useCameraRoll().skeletonCount
};

type GridItem =
  | { type: 'camera' }
  | { type: 'asset'; asset: AssetLite }
  | { type: 'placeholder'; key: string };

const CELL = getTileSize(Dimensions.get('window').width);

// ── Camera tile ───────────────────────────────────────────────────────────────
const CameraTile = memo(function CameraTile({ onPress }: { onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={[styles.cell, styles.cameraCell]}>
      <Text style={styles.cameraEmoji}>📷</Text>
      <Text style={styles.cameraLabel}>Camera</Text>
    </Pressable>
  );
});

// ── Thumb (photo) tile ────────────────────────────────────────────────────────
const ThumbItem = memo(function ThumbItem({
  asset,
  isSelected,
  selectionIndex,
  onPress,
}: {
  asset: AssetLite;
  isSelected: boolean;
  selectionIndex: number | null; // 1-based index when selected
  onPress(): void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.cell}>
      <Image source={{ uri: asset.uri }} style={styles.image} contentFit="cover" />
      {isSelected && selectionIndex != null ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectionIndex}</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

const Placeholder = memo(function Placeholder() {
  return <View style={[styles.cell, styles.placeholder]} />;
});

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PhotoGrid({
  assets,
  selectedIds,
  onToggle,
  onJumpToCamera,
  onEndReachMore,
  hasNextPage,
  loading,
  onScrollY,
  skeletonCount = COLS * 3, // ~3 rows by default
}: PhotoGridProps) {
  // Data: [CameraTile, ...assets, ...placeholders (when loading)]
    const data: GridItem[] = useMemo(() => {
    const items: GridItem[] = [
        { type: 'camera' as const },
        ...assets.map(a => ({ type: 'asset' as const, asset: a })),
    ];
    if (loading) {
        for (let i = 0; i < skeletonCount; i++) {
        items.push({ type: 'placeholder' as const, key: `ph-${i}` });
        }
    }
    return items;
    }, [assets, loading, skeletonCount]);

  const keyExtractor = useCallback((item: GridItem) => {
    if (item.type === 'camera') return 'camera';
    if (item.type === 'asset') return item.asset.id;
    return item.key;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => {
      if (item.type === 'camera') return <CameraTile onPress={onJumpToCamera} />;
      if (item.type === 'asset') {
        const id = item.asset.id;
        const idx = selectedIds.indexOf(id);
        return (
          <ThumbItem
            asset={item.asset}
            isSelected={idx !== -1}
            selectionIndex={idx !== -1 ? idx + 1 : null}
            onPress={() => onToggle(item.asset)}
          />
        );
      }
      return <Placeholder />;
    },
    [onJumpToCamera, onToggle, selectedIds]
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => onScrollY(e.nativeEvent.contentOffset.y),
    [onScrollY]
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage) onEndReachMore();
  }, [hasNextPage, onEndReachMore]);

const getItemLayout: FlatListProps<GridItem>['getItemLayout'] = (_, index) => {
    const row = Math.floor(index / COLS);
    return { length: CELL, offset: row * CELL, index };
};


  
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={COLS}
      onScroll={onScroll}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      getItemLayout={getItemLayout}
      removeClippedSubviews
      initialNumToRender={32}
      maxToRenderPerBatch={32}
      windowSize={11}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: { paddingBottom: 2 },
  cell: { width: CELL, height: CELL },
  image: { width: '100%', height: '100%' },
  cameraCell: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  cameraEmoji: { fontSize: 22, color: 'white' },
  cameraLabel: { marginTop: 4, fontSize: 12, color: 'white', opacity: 0.8 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  placeholder: { backgroundColor: '#E5E5EA' },
});
