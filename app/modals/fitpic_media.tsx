// app/modals/fitpic_media.tsx
import * as React from 'react';
import { View, StyleSheet, Alert } from 'react-native';

import useCameraController from '../../src/FitPic/usecameracontroller';
import CameraSurface from '../../src/FitPic/camerasurface';
import ShutterButton from '../../src/FitPic/shutterbutton';
import { useDrafts } from '../../src/FitPic/draftcontext';
import CornerThumbStack from '../../src/FitPic/thumbnailstack';
import SelectedDrawer from '../../src/FitPic/selecteddrawer';

/**
 * FitPic media capture screen (modal).
 *
 * Renders the camera feed full-screen via <CameraSurface /> and shows a single
 * bottom-centered shutter button. Pressing the button triggers controller.takePhoto().
 */
export default function FitPicMediaScreen() {
  const controller = useCameraController();

  // >>> Step 19: read items/remove from DraftsContext + local drawer state
  const { items, remove } = useDrafts();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // <<<

  // >>> Step 20: placeholder next handler (will add validation later)
  const handleNext = React.useCallback(() => {
    Alert.alert('Next', `Proceeding with ${items.length} item(s).`);
  }, [items.length]);
  // <<<

  const onShutterPress = React.useCallback(() => {
    if (controller?.takePhoto) controller.takePhoto();
  }, [controller]);

  return (
    <View style={styles.container}>
      {/* Full-screen live camera */}
      <CameraSurface controller={controller} />

      {/* Step 18: bottom-right thumbnail stack overlay */}
      <View style={styles.cornerStackContainer} pointerEvents="box-none">
        <CornerThumbStack items={items} onPress={() => setDrawerOpen(true)} />
      </View>

      {/* Existing shutter button */}
      <View style={{ position: 'absolute', bottom: 36, alignSelf: 'center' }} pointerEvents="box-none">
        <ShutterButton onPress={onShutterPress} />
      </View>

      {/* Step 19: bottom sheet drawer */}
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
  // Added: places the stack at bottom-right, above the shutter
  cornerStackContainer: {
    position: 'absolute',
    right: 16,
    bottom: 120, // keeps it clear of the shutter
  },
});