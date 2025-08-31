// app/modals/fitpic_media.tsx
import * as React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import FitPicPager, {
  type FitPicPagerHandle as FitPicPagerRef,
} from '../../src/FitPic/fitpicpager';

import CameraRollScreen from '../../src/FitPic/roll/camerarollscreen';

import { useCameraController } from '../../src/FitPic/camera/usecameracontroller';
import CameraSurface from '../../src/FitPic/camera/camerasurface';
import ShutterButton from '../../src/FitPic/camera/shutterbutton';
import { useDrafts } from '../../src/FitPic/draftcontext';
import CornerThumbStack from '../../src/FitPic/thumbnailstack';
import SelectedDrawer from '../../src/FitPic/selecteddrawer';
import TopLeftControls from '../../src/FitPic/camera/topleftcontrols';
import TopRightControls from '../../src/FitPic/camera/toprightcontrols';

import type { MediaItem } from '../../src/FitPic/camera/media';

export default function FitPicMediaScreen() {
  const pagerRef = React.useRef<FitPicPagerRef>(null);
  const router = useRouter();

  const controller = useCameraController();
  const { takePhoto } = controller;

  const { items, add, remove } = useDrafts();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleNext = React.useCallback(() => {
    Alert.alert('Next', `Proceeding with ${items.length} item(s).`);
  }, [items.length]);

  // Await capture/stop and write the result into Drafts (typed as MediaItem)
  const onShutterPress = React.useCallback(async () => {
    const media = (await takePhoto?.()) as MediaItem | undefined;
    if (media) add(media);
  }, [takePhoto, add]);

  return (
    <View style={styles.container}>
      <FitPicPager
        initialIndex={0} // land on Camera Roll (page 0)
        ref={pagerRef}
        onIndexChange={() => {}}
        renderCameraRoll={() => (
          <CameraRollScreen
            onJumpToCamera={() => pagerRef.current?.setPage(1)}
            onClose={() => router.back()}
            onNext={(selectionIds) => {
              // Navigate to your post screen with ordered IDs.
              // Adjust the pathname to match your route if needed.
              router.push({ pathname: '/post', params: { selectionIds: JSON.stringify(selectionIds) } });
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
            <View style={{ position: 'absolute', bottom: 36, alignSelf: 'center' }} pointerEvents="box-none">
              <ShutterButton onPress={onShutterPress} />
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
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
  },
  cornerStackContainer: {
    position: 'absolute',
    right: 5,
    bottom: 30,
  },
});
