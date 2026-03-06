// app/create-modals/fitpic_media.tsx
import * as React from 'react';
import { View, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

import FitPicPager, {
  type FitPicPagerHandle as FitPicPagerRef,
} from '../../components/create/fitpicpager';

import CameraRollScreen from '../../components/create/roll/camerarollscreen-fitpic';

import { useCameraController } from '../../components/create/camera/usecameracontroller';
import CameraSurface from '../../components/create/camera/camerasurface';
import ShutterButton from '../../components/create/camera/shutterbutton';
import GallerButton from '../../components/create/camera/gallerybutton';
import { useDrafts } from '../../components/create/draftcontext';
import CornerThumbStack from '../../components/create/thumbnailstack';
import SelectedDrawer from '../../components/create/selecteddrawer';
import TopLeftControls from '../../components/create/camera/topleftcontrols';
import TopRightControls from '../../components/create/camera/toprightcontrols';

import type { MediaItem } from '../../components/create/camera/media';

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
    // Check max limit before taking photo
    if (selectedIds.length >= 5) {
      Alert.alert(
        'Maximum Selection Reached',
        'You can only select up to 5 photos. Please deselect a photo first.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  // Largest 9:16 (width : height) box that fits in the window — Snapchat-style full-screen framing
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const cameraBox = React.useMemo(() => {
    if (winWidth / winHeight <= 9 / 16) {
      return { width: winWidth, height: winWidth * (16 / 9) };
    }
    return { width: winHeight * (9 / 16), height: winHeight };
  }, [winWidth, winHeight]);

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
          <View style={styles.captureRoot}>
            <View style={styles.cameraArea}>
              <View
                style={[
                  styles.cameraBox,
                  { width: cameraBox.width, height: cameraBox.height },
                ]}
                pointerEvents="box-none"
              >
                {shouldShowCamera ? (
                  <CameraSurface controller={controller} style={styles.cameraFill} />
                ) : (
                  <View style={[styles.cameraFill, styles.cameraPlaceholder]} />
                )}

                <TopLeftControls paddingTopOverride={12} />
                <TopRightControls
                  controller={controller}
                  onNext={handleNext}
                  insetsOverride={{ top: 12, right: 12 }}
                />

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
  captureRoot: { flex: 1, backgroundColor: '#0d0d0d' },
  cameraArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
  },
  cameraBox: { backgroundColor: '#000' },
  cameraFill: { flex: 1 },
  cameraPlaceholder: { backgroundColor: '#000' },
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