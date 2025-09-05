// app/modals/fitpic_media.tsx
import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import FitPicPager, {
  type FitPicPagerHandle as FitPicPagerRef,
} from '../../src/FitPic/fitpicpager';

import CameraRollScreen from '../../src/FitPic/roll/camerarollscreen';

import { useCameraController } from '../../src/FitPic/camera/usecameracontroller';
import CameraSurface from '../../src/FitPic/camera/camerasurface';
import ShutterButton from '../../src/FitPic/camera/shutterbutton';
import GallerButton from '../../src/FitPic/camera/gallerybutton'; 
import { useDrafts } from '../../src/FitPic/draftcontext';
import CornerThumbStack from '../../src/FitPic/thumbnailstack';
import SelectedDrawer from '../../src/FitPic/selecteddrawer';
import TopLeftControls from '../../src/FitPic/camera/topleftcontrols';
import TopRightControls from '../../src/FitPic/camera/toprightcontrols';

import type { MediaItem } from '../../src/FitPic/camera/media';
import { usePostContext } from '../../src/FitPic/post/postcontext';

export default function FitPicMediaScreen() {
  const pagerRef = React.useRef<FitPicPagerRef>(null);
  const router = useRouter();

  const controller = useCameraController();
  const { takePhoto } = controller;

  const { items, add, remove } = useDrafts();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Helper: seed draft + navigate
  const postDraft = usePostContext();
  const goToPost = React.useCallback(
    (ids: string[]) => {
      if (!ids || ids.length === 0) return;
      postDraft.startFromSelection(ids);
      router.push('./fitpic_post');
    },
    [postDraft, router]
  );

  // "Next" from Selected Drawer
  const handleNext = React.useCallback(() => {
    const ids = items.map((m) => m.id);
    goToPost(ids);
  }, [items, goToPost]);

  // Take photo and stash into Drafts
  const onShutterPress = React.useCallback(async () => {
    const media = (await takePhoto?.()) as MediaItem | undefined;
    if (media) add(media);
  }, [takePhoto, add]);

  return (
    <View style={styles.container}>
      <FitPicPager
        initialIndex={1} // land on Camera (page 1)
        ref={pagerRef}
        onIndexChange={() => {}}
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
            <CameraSurface controller={controller} />

            <TopLeftControls />
            <TopRightControls controller={controller} photoCount={items.length} />

            <View style={styles.cornerStackContainer} pointerEvents="box-none">
              <CornerThumbStack items={items} onPress={() => setDrawerOpen(true)} />
            </View>

            {/* Bottom bar: shutter centered; gallery on the left */}
            <View style={styles.bottomBar} pointerEvents="box-none">
              <View style={styles.centerRow} pointerEvents="box-none">
                <GallerButton
                  onOpen={() => pagerRef.current?.setPage(0)}
                  style={{ marginRight: 12 }}
                />
                <ShutterButton onPress={onShutterPress} />
                {/* Spacer to mirror gallery width so shutter stays perfectly centered */}
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

  cornerStackContainer: {
    position: 'absolute',
    right: 5,
    bottom: 30,
  },

  // full-width bar pinned to bottom; contents centered
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 36, // tweak to taste / safe-area
    alignItems: 'center',
    justifyContent: 'center',
  },

  // keeps shutter centered by balancing left (gallery) with a right spacer
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});