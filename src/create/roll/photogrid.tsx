// app/src/create/cameraroll/PhotoGrid.tsx
import type { FlatListProps, ListRenderItem } from 'react-native';
import React, { memo, useMemo, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
} from 'react-native';
import type { AssetLite } from './types';
import { COLS, getTileSize } from './types';
import CameraTile from './CameraTile';
import ThumbItem from './ThumbItem';


type PhotoGridProps = {
  assets: AssetLite[];                 // useCameraRoll().assets (photos only upstream)
  selectedIds: string[];               // useSelectionSync().selectedIds
  onToggle(asset: AssetLite): void;    // useSelectionSync().toggle
  onJumpToCamera?: () => void;         // first-cell press (optional)
  onEndReachMore(): void;              // load next page
  hasNextPage: boolean;
  loading: boolean;                    // show skeletons
  onScrollY(y: number): void;          // to collapse preview panel
  skeletonCount?: number;              // pass useCameraRoll().skeletonCount
  showCameraTile?: boolean;            // whether to show camera tile
};

type GridItem =
  | { type: 'camera' }
  | { type: 'asset'; asset: AssetLite }
  | { type: 'placeholder'; key: string };

const CELL = getTileSize(Dimensions.get('window').width);

// ── Components are now imported from separate files ───────────────────────────

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
  showCameraTile = true,
}: PhotoGridProps) {
  // Data: [CameraTile (optional), ...assets, ...placeholders (when loading)]
    const data: GridItem[] = useMemo(() => {
    const items: GridItem[] = [];
    
    if (showCameraTile) {
        items.push({ type: 'camera' as const });
    }
    
    items.push(...assets.map(a => ({ type: 'asset' as const, asset: a })));
    
    if (loading) {
        for (let i = 0; i < skeletonCount; i++) {
        items.push({ type: 'placeholder' as const, key: `ph-${i}` });
        }
    }
    return items;
    }, [assets, loading, skeletonCount, showCameraTile]);

  const keyExtractor = useCallback((item: GridItem) => {
    if (item.type === 'camera') return 'camera';
    if (item.type === 'asset') return item.asset.id;
    return item.key;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => {
      if (item.type === 'camera') return <CameraTile onPress={onJumpToCamera!} />;
      if (item.type === 'asset') {
        const id = item.asset.id;
        const idx = selectedIds.indexOf(id);
        return (
          <ThumbItem
            asset={item.asset}
            isSelected={idx !== -1}
            selectionIndex={idx !== -1 ? idx + 1 : null}
            onPress={() => onToggle(item.asset)}
            size={CELL}
          />
        );
      }
      return <Placeholder />;
    },
    [onJumpToCamera, onToggle, selectedIds, CELL]
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
      columnWrapperStyle={COLS > 1 ? styles.row : undefined}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: { paddingBottom: 2 },
  row: { 
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  cell: { width: CELL, height: CELL },
  placeholder: { backgroundColor: '#E5E5EA' },
});
