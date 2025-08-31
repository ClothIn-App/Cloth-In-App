// app/features/fitpic/CameraSurface.tsx
import * as React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { CameraView } from 'expo-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import type { useCameraController } from './usecameracontroller';
type CameraController = ReturnType<typeof useCameraController>;

type Props = {
  controller: CameraController;
  style?: StyleProp<ViewStyle>;
  enableZoomGesture?: boolean; // our custom pinch
  children?: React.ReactNode;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function CameraSurface({
  controller,
  style,
  enableZoomGesture = true,
  children,
}: Props) {
  // Keep the zoom-at-pinch-start ONLY on the JS side (never in a worklet)
  const startZoomRef = React.useRef(controller.zoom);

  const onPinchBegin = React.useCallback(() => {
    // read current zoom from controller in JS
    startZoomRef.current = controller.zoom;
  }, [controller.zoom]);

  const onPinchUpdate = React.useCallback(
    (scale: number) => {
      // compute next zoom in JS and call controller setter
      const next = clamp01(startZoomRef.current * scale);
      controller.setZoomSmooth(next);
    },
    [controller]
  );

  // Pinch — worklet forwards primitives to JS; it doesn't capture the ref
  const pinch = React.useMemo(
    () =>
      Gesture.Pinch()
        .enabled(!!enableZoomGesture)
        .onBegin(() => {
          runOnJS(onPinchBegin)();
        })
        .onUpdate((e) => {
          runOnJS(onPinchUpdate)(e.scale);
        }),
    [enableZoomGesture, onPinchBegin, onPinchUpdate]
  );

  // Double-tap → flip (also via runOnJS)
  const doubleTap = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd((_e, success) => {
          if (success) runOnJS(controller.flip)();
        }),
    [controller]
  );

  const gesture = enableZoomGesture
    ? Gesture.Simultaneous(pinch, doubleTap)
    : doubleTap;

  return (
    <View style={[styles.root, style]}>
      <GestureDetector gesture={gesture}>
        <CameraView
          ref={controller.cameraRef}
          style={styles.camera}
          facing={controller.facing}
          zoom={controller.zoom}
          flash={controller.flashMode}            
        />
      </GestureDetector>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', position: 'relative' },
  camera: { flex: 1 },
});