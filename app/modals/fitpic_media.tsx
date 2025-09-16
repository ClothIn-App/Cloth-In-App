// app/modals/fitpic_media.tsx
import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import FitPicPager, {
  type FitPicPagerHandle as FitPicPagerRef,
} from '../../src/create/fitpicpager';

import CameraRollScreen from '../../src/create/roll/camerarollscreen';

import { useCameraController } from '../../src/create/camera/usecameracontroller';
import CameraSurface from '../../src/create/camera/camerasurface';
import ShutterButton from '../../src/create/camera/shutterbutton';
import GallerButton from '../../src/create/camera/gallerybutton';
import { useDrafts } from '../../src/create/draftcontext';
import CornerThumbStack from '../../src/create/thumbnailstack';
import SelectedDrawer from '../../src/create/selecteddrawer';
import TopLeftControls from '../../src/create/camera/topleftcontrols';
import TopRightControls from '../../src/create/camera/toprightcontrols';

import type { MediaItem } from '../../src/create/camera/media';

export default function FitPicMediaScreen() {
  const pagerRef = React.useRef<FitPicPagerRef>(null);
  const router = useRouter();
  const isFocused = useIsFocused();

  const controller = useCameraController();
  const { takePhoto } = controller;

  const {
    items,
    add,
    remove,
    addSelected,
    setSelectedOrder,
    selectedIds, // ← use current selection to append new ids in-order
  } = useDrafts();

  const selectedItems = React.useMemo(() => {
  const byId = new Map(items.map(m => [m.id, m]));
  return selectedIds
    .map(id => byId.get(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}, [items, selectedIds]);

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Track which page the pager is on: 0 = Gallery, 1 = Camera
  const [activeIndex, setActiveIndex] = React.useState(1);

  // On blur/unmount, release camera resources if controller supports it
  React.useEffect(() => {
    if (!isFocused) {
      try { controller.pause?.(); } catch {}
    }
    return () => {
      try { controller.stop?.(); } catch {}
    };
  }, [isFocused, controller]);

  // Seed Drafts selection and navigate to Post
  const goToPost = React.useCallback(
    (ids: string[]) => {
      if (!ids?.length) return;
      // Ensure selectedIds in Drafts reflects the chosen order
      addSelected(ids.map((id) => ({ id })));
      setSelectedOrder(ids);
      router.push('./fitpic_post');
    },
    [addSelected, setSelectedOrder, router]
  );

  // "Next" from Selected Drawer
  const handleNext = React.useCallback(() => {
    goToPost(selectedIds);
  }, [selectedIds, goToPost]);

  // "Back" from Camera page
  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);
  // Take photo → add to drafts → mark selected → keep order
  const onShutterPress = React.useCallback(async () => {
    const media = (await takePhoto?.()) as MediaItem | undefined;
    if (!media) return;

    const id =
      (media as any).id ??
      (media as any).assetId ??
      media.uri ??
      `cap_${Date.now()}`;

    // Ensure the stored item has a stable id
    add({ ...(media as any), id });

    // Selection drives the "Next" button & the Post modal
    addSelected([{ id }]);

    // Preserve selection order (append newest capture at the end)
    setSelectedOrder([...(selectedIds ?? []), id]);
  }, [takePhoto, add, addSelected, setSelectedOrder, selectedIds]);

  // Only render the live camera when focused and on the camera page
  const shouldShowCamera = isFocused && activeIndex === 1;

  return (
    <View style={styles.container}>
      <FitPicPager
        initialIndex={1} // land on Camera (page 1)
        ref={pagerRef}
        onIndexChange={(i) => setActiveIndex(i)}
        renderCameraRoll={() => (
          <CameraRollScreen
            onJumpToCamera={() => pagerRef.current?.setPage(1)}
            onClose={() => router.back()}
            // "Next" from Camera Roll
            onNext={(selectionIds) => {
              goToPost(selectionIds);
            }}
          />
        )}
        renderCapture={() => (
          <View style={{ flex: 1 }}>
            {shouldShowCamera ? (
              <CameraSurface controller={controller} />
            ) : (
              <View style={{ flex: 1, backgroundColor: '#000' }} />
            )}

            <TopLeftControls />
            <TopRightControls controller={controller} onNext={handleNext} />

            <View style={styles.cornerStackContainer} pointerEvents="box-none">
              <CornerThumbStack items={selectedItems} onPress={() => setDrawerOpen(true)} />
            </View>

            {/* Bottom bar: shutter centered; gallery on the left */}
            <View style={styles.bottomBar} pointerEvents="box-none">
              <View style={styles.centerRow} pointerEvents="box-none">
                <GallerButton
                  onOpen={() => pagerRef.current?.setPage(0)}
                  style={{ marginRight: 12 }}
                />
                <ShutterButton onPress={onShutterPress} />
                <View style={{ width: 44 }} />
              </View>
            </View>
          </View>
        )}
      />

      <SelectedDrawer
        visible={drawerOpen}
        items={items}
        onClose={() => setDrawerOpen(false)}
        onRequestClose={() => setDrawerOpen(false)}
        onRemove={remove}
        onNext={handleNext}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cornerStackContainer: { position: 'absolute', right: 5, bottom: 30 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});