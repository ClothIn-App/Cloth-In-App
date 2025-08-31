// app/src/FitPic/cameraroll/CameraRollScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, SafeAreaView, StyleSheet } from 'react-native';

import { useCameraRoll } from './usecameraroll';
import { useSelectionSync } from './useselectionsync';
import PreviewPanel from './previewpanel';
import PhotoGrid from './photogrid';
import type { AssetLite } from './types';

type CameraRollScreenProps = {
  onJumpToCamera: () => void;                 // pager → page 1
  onClose: () => void;                        // header X
  onNext: (selectionIds: string[]) => void;   // header Next
};

export default function CameraRollScreen({
  onJumpToCamera,
  onClose,
  onNext,
}: CameraRollScreenProps) {
  // Camera Roll + selection state
  const {
    assets,
    permissionStatus,
    requestPermission,
    refresh,
    hasNextPage,
    loadNextPage,
    loading,
    refreshing,
    skeletonCount,
  } = useCameraRoll();

  const { selectedIds, selectedCount, toggle } = useSelectionSync();

  // Local UI: which image to preview + whether panel is open
  const [lastTappedId, setLastTappedId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Compute preview uri from the last tapped/active id
  const previewUri = useMemo(() => {
    if (!lastTappedId) return null;
    const a = assets.find(x => x.id === lastTappedId);
    return a ? a.uri : null;
  }, [assets, lastTappedId]);

  // Keep preview target synced with current selection order
  useEffect(() => {
    if (selectedIds.length === 0) {
      setIsPreviewOpen(false);
      setLastTappedId(null);
      return;
    }
    if (!lastTappedId || !selectedIds.includes(lastTappedId)) {
      setLastTappedId(selectedIds[selectedIds.length - 1]);
    }
  }, [selectedIds, lastTappedId]);

  // Tapping a grid item toggles selection and re-opens preview on that image
  const handleToggle = useCallback((asset: AssetLite) => {
    setLastTappedId(asset.id);
    setIsPreviewOpen(true);
    toggle(asset);
  }, [toggle]);

  // Collapse preview when the grid scrolls down a bit
  const handleScrollY = useCallback((y: number) => {
    if (y > 24 && isPreviewOpen) setIsPreviewOpen(false);
  }, [isPreviewOpen]);

  const handleNext = useCallback(() => {
    if (selectedCount > 0) onNext(selectedIds);
  }, [onNext, selectedCount, selectedIds]);

  // Permission fallback
  if (permissionStatus !== 'granted') {
    return (
      <SafeAreaView style={styles.fallbackWrap}>
        <View style={styles.fallback}>
          <Text style={styles.fbTitle}>Allow Photos Access</Text>
          <Text style={styles.fbMsg}>
            We need access to your photo library to show your Camera Roll.
          </Text>
          <Pressable
            onPress={async () => {
              await requestPermission();
              await refresh();
            }}
            style={styles.fbBtn}
          >
            <Text style={styles.fbBtnText}>Allow Photos Access</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Swap this Pressable for your own TopLeftControls "X" if you prefer */}
        <Pressable onPress={onClose} hitSlop={8} style={styles.left}>
          <Text style={styles.x}>✕</Text>
        </Pressable>

        <Text style={styles.title}>Camera Roll</Text>

        <Pressable
          onPress={handleNext}
          disabled={selectedCount === 0}
          hitSlop={8}
          style={[styles.right, selectedCount === 0 && styles.nextDisabled]}
        >
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      {/* Sliding preview panel */}
      <PreviewPanel uri={previewUri} expanded={isPreviewOpen} />

      {/* Grid (fills the rest) */}
      <View style={styles.gridWrap}>
        <PhotoGrid
          assets={assets}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onJumpToCamera={onJumpToCamera}
          onEndReachMore={loadNextPage}
          hasNextPage={hasNextPage}
          loading={loading || refreshing}
          onScrollY={handleScrollY}
          skeletonCount={skeletonCount}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  left: { width: 44, alignItems: 'flex-start' },
  right: { width: 64, alignItems: 'flex-end', opacity: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  x: { fontSize: 18, color: '#111' },
  nextText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  nextDisabled: { opacity: 0.35 },
  gridWrap: { flex: 1 },

  // Permission fallback
  fallbackWrap: { flex: 1, backgroundColor: 'white' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  fbTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  fbMsg: { fontSize: 14, textAlign: 'center', marginBottom: 16, color: '#333' },
  fbBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#007AFF',
  },
  fbBtnText: { fontSize: 15, fontWeight: '600', color: '#007AFF' },
});
