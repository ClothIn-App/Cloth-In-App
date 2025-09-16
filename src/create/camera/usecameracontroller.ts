import { useCallback, useRef, useState } from 'react';

export type CameraMode = 'photo' | 'video';
export type FlashMode = 'off' | 'on' | 'auto';

function useCameraController() {
  const cameraRef = useRef<any>(null);

  const [mode, setMode] = useState<CameraMode>('photo');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0); // 0..1
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const flip = useCallback(() => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((f) => (f === 'off' ? 'on' : 'off'));
  }, []);

  // These are JS-side helpers (never call from a worklet directly)
  const pause = useCallback(async () => {
    try {
      await cameraRef.current?.pausePreview?.();
    } catch {}
  }, []);

  const stop = useCallback(() => {
    try {
      cameraRef.current?.stopRecording?.();
    } catch {}
  }, []);

  const takePhoto = useCallback(async () => {
    const cam = cameraRef.current;
    if (!cam) return null;
    const photo = await cam.takePictureAsync?.({ quality: 1 });
    if (!photo) return null;
    return {
      id: String(Date.now()),
      type: 'photo' as const,
      uri: photo.uri,
      width: photo.width,
      height: photo.height,
    };
  }, []);

  return {
    // ref
    cameraRef,

    // modes
    mode,
    setMode,

    // flash
    flashMode,
    setFlashMode,
    toggleFlash,

    // device controls
    facing,
    flip,

    zoom,
    setZoom,

    // actions
    takePhoto,
    pause,
    stop,
  };
}

export type UseCameraControllerReturn = ReturnType<typeof useCameraController>;
export default useCameraController;
export { useCameraController };
