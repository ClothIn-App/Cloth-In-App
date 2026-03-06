import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

import type { useCameraController } from './usecameracontroller';
type CameraController = ReturnType<typeof useCameraController>;

type Props = {
  controller: CameraController;
  style?: StyleProp<ViewStyle>;
  enableZoomGesture?: boolean;
  children?: React.ReactNode;
};

const MIN_X = 0;
const MAX_X = 1;
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
const xToNorm = (x: number) => clamp((x - MIN_X) / (MAX_X - MIN_X), 0, 1);
const normToX = (n: number) => MIN_X + n * (MAX_X - MIN_X);

export default function CameraSurface({
  controller,
  style,
  enableZoomGesture = true,
  children,
}: Props) {
  const isFocused = useIsFocused();

  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = React.useState(false);
  const startZoomXRef = React.useRef(normToX(controller.zoom));

  // Ask for permission once
  React.useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  // Release camera when screen loses focus / on unmount
  React.useEffect(() => {
    if (!isFocused) {
      controller.pause?.();      // pause preview if possible
    }
    return () => {
      controller.stop?.();       // stop recording if any
    };
  }, [isFocused, controller]);

  // ---- Gesture handlers (ALWAYS hop back to JS) ----
  const onPinchBeginJS = React.useCallback(() => {
    startZoomXRef.current = normToX(controller.zoom);
  }, [controller.zoom]);

  const onPinchUpdateJS = React.useCallback(
    (scale: number) => {
      const nextX = clamp(startZoomXRef.current * scale, MIN_X, MAX_X);
      controller.setZoom(xToNorm(nextX));
    },
    [controller]
  );

  const onDoubleTapJS = React.useCallback(() => {
    controller.flip();
  }, [controller]);

  const pinch = React.useMemo(
    () =>
      Gesture.Pinch()
        .enabled(!!enableZoomGesture)
        .onBegin(() => runOnJS(onPinchBeginJS)())
        .onUpdate((e) => runOnJS(onPinchUpdateJS)(e.scale)),
    [enableZoomGesture, onPinchBeginJS, onPinchUpdateJS]
  );

  const doubleTap = React.useMemo(
    () => Gesture.Tap().numberOfTaps(2).onEnd(() => runOnJS(onDoubleTapJS)()),
    [onDoubleTapJS]
  );

  const gesture = enableZoomGesture
    ? Gesture.Simultaneous(pinch, doubleTap)
    : doubleTap;

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <TouchableOpacity onPress={() => requestPermission()}>
          <Text style={[styles.text, { textDecorationLine: 'underline' }]}>
            Grant permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Only mount CameraView when the screen is focused
  return isFocused ? (
    <View style={[styles.root, style]}>
      <GestureDetector gesture={gesture}>
        <CameraView
          ref={controller.cameraRef}
          style={styles.camera}
          facing={controller.facing}
          zoom={controller.zoom}        // 0..1 normalized
          flash={controller.flashMode}
          {...(Platform.OS === 'ios' && { selectedLens: 'builtInWideAngleCamera' })}
          onCameraReady={() => setReady(true)}
        />
      </GestureDetector>

      {!ready && (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator />
        </View>
      )}

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  ) : (
    <View style={styles.root} />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', position: 'relative' },
  camera: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 16, marginVertical: 6 },
});
