// app/features/fitpic/usecameracontroller.ts
import { useCallback, useRef, useState } from 'react';

export type CameraMode = 'photo' | 'video';
export type FlashMode = 'off' | 'on' | 'auto';

function useCameraController() {
  // --- refs ---
  const cameraRef = useRef<any>(null);

  // --- states (kept simple to avoid coupling to a specific camera lib) ---
  const [mode, setMode] = useState<CameraMode>('photo'); // NEW per task
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [zoom, setZoom] = useState(0);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // --- device / UI helpers ---
  const flip = useCallback(() => {
    setFacing((p) => (p === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((f) => (f === 'off' ? 'on' : 'off'));
  }, []);

  // --- photo ---
  const takePhoto = useCallback(async () => {
    const cam: any = cameraRef.current;
    if (!cam?.takePictureAsync) return null;

    try {
      const result = await cam.takePictureAsync?.({});
      const now = Date.now();
      const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;

      return {
        id,
        uri: result?.uri,
        width: result?.width,
        height: result?.height,
        createdAt: now,
        type: 'photo',
        thumbnailUri: result?.uri,
      };
    } catch (e) {
      console.warn('takePhoto error:', e);
      return null;
    }
  }, []);



  // --- public API ---
  return {
    // refs
    cameraRef,

    // capture mode (NEW)
    mode,
    setMode,

    takePhoto,

    // flash
    flashMode,
    setFlashMode,
    toggleFlash,


    // device controls
    facing,
    flip,
    zoom,
    setZoom,
  };
}

export type UseCameraControllerReturn = ReturnType<typeof useCameraController>;
export default useCameraController;
export { useCameraController };