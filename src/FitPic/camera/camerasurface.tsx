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
  enableZoomGesture?: boolean; // keep for our custom pinch toggle
  children?: React.ReactNode;
};

// Apple-style factor mapping 1x..10x <-> 0..1
const MIN_X = 1;
const MAX_X = 10;
const clampX = (v: number) => (v < MIN_X ? MIN_X : v > MAX_X ? MAX_X : v);
const xToNorm = (x: number) => (x - MIN_X) / (MAX_X - MIN_X);
const normToX = (n: number) => MIN_X + n * (MAX_X - MIN_X);

export default function CameraSurface({
  controller,
  style,
  enableZoomGesture = true,
  children,
}: Props) {
  const startZoomXRef = React.useRef(normToX(controller.zoom));

  const onPinchBegin = React.useCallback(() => {
    startZoomXRef.current = normToX(controller.zoom);
  }, [controller.zoom]);

  const onPinchUpdate = React.useCallback(
    (scale: number) => {
      const nextX = clampX(startZoomXRef.current * scale);
      const nextNorm = xToNorm(nextX);
      // ✅ use your existing controller API
      controller.setZoom(nextNorm);
    },
    [controller]
  );

  const pinch = React.useMemo(
    () =>
      Gesture.Pinch()
        .enabled(!!enableZoomGesture)
        .onBegin(() => runOnJS(onPinchBegin)())
        .onUpdate((e) => runOnJS(onPinchUpdate)(e.scale)),
    [enableZoomGesture, onPinchBegin, onPinchUpdate]
  );

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
          zoom={controller.zoom}   // normalized 0..1
          flash={controller.flashMode}
          // removed enableZoomGesture — not supported on your SDK
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
