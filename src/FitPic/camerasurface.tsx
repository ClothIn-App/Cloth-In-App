// app/features/fitpic/CameraSurface.tsx
import * as React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { CameraView } from 'expo-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Type only: infer the controller shape from your hook (no runtime import impact)
import useCameraController from './usecameracontroller';
type CameraController = ReturnType<typeof useCameraController>;

type Props = {
  controller: CameraController;
  style?: StyleProp<ViewStyle>;
  /** Toggle pinch-to-zoom gesture */
  enableZoomGesture?: boolean;
  /** Optional overlay UI (buttons, drawers, etc.) */
  children?: React.ReactNode;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export default function CameraSurface({
  controller,
  style,
  enableZoomGesture = true,
  children,
}: Props) {
  const startZoomRef = React.useRef(controller.zoom);

  // Pinch to zoom — base zoom captured on begin, then scaled.
  const pinch = Gesture.Pinch()
    .enabled(enableZoomGesture)
    .onBegin(() => {
      startZoomRef.current = controller.zoom;
    })
    .onUpdate((e) => {
      const next = clamp01(startZoomRef.current * e.scale);
      controller.setZoomSmooth(next);
    });

  // Double-tap to flip camera.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      controller.flip();
    });

  const gesture = Gesture.Simultaneous(pinch, doubleTap);

  return (
    <View style={[styles.root, style]}>
      <GestureDetector gesture={gesture}>
        <CameraView
          ref={controller.cameraRef}
          style={styles.camera}
          facing={controller.facing}
          zoom={controller.zoom}
          // Torch is the continuous light (useful for video / dark scenes)
          enableTorch={controller.torchOn}
          // NOTE: CameraView doesn't take a "flash" prop.
          // If you need flash for stills, pass it in takePictureAsync options.
        />
      </GestureDetector>

      {/* Overlay your controls ABOVE the camera; stays fully touchable */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
});