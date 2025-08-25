// app/hooks/useCameraController.ts
import { useCallback, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Camera, CameraView } from 'expo-camera';
import { Platform } from 'react-native';

import type { MediaItem } from './media';
import { useDrafts } from './draftcontext';

// Local, SDK-safe unions (avoid importing FlashMode/CameraType which may not exist)
type CameraFacing = 'front' | 'back';
type FlashModeValue = 'off' | 'on' | 'auto' | 'torch';

export type UseCameraController = {
  cameraRef: MutableRefObject<CameraView | null>;
  facing: CameraFacing;
  flashOn: boolean;   // still photos
  torchOn: boolean;   // continuous for video
  zoom: number;
  isRecording: boolean;
  canTakePhoto: boolean;

  flashMode: FlashModeValue;

  flip(): void;
  toggleFlash(): void;
  toggleTorch(): void;
  setZoomSmooth(v: number): void;

  takePhoto(): Promise<MediaItem | void>;
  startVideo(opts?: { maxMs?: number }): Promise<void>;
  stopVideo(): Promise<void>;
};

export default function useCameraController(): UseCameraController {
  const cameraRef = useRef<CameraView | null>(null);

  // Your DraftsContext likely returns only items/add/remove/clear.
  const { items, add } = useDrafts();
  const MAX_DRAFT_ITEMS = 5;

  const [facing, setFacing] = useState<CameraFacing>('back');
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const canTakePhoto = (items?.length ?? 0) < MAX_DRAFT_ITEMS;

  // Single flash value for <CameraView flash={...}/>
  const flashMode: FlashModeValue = useMemo(() => {
    if (isRecording && torchOn) return 'torch';
    return flashOn ? 'on' : 'off';
  }, [flashOn, torchOn, isRecording]);

  const requestCameraPerms = useCallback(async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }, []);
  const requestMicPerms = useCallback(async () => {
    const { status } = await Camera.requestMicrophonePermissionsAsync();
    return status === 'granted';
  }, []);
  const ensureCameraPermission = useCallback(async () => requestCameraPerms(), [requestCameraPerms]);
  const ensureVideoPermissions = useCallback(async () => {
    const cam = await requestCameraPerms();
    const mic = await requestMicPerms();
    return cam && mic;
  }, [requestCameraPerms, requestMicPerms]);

  const flip = useCallback(() => {
    setFacing((cur) => (cur === 'back' ? 'front' : 'back'));
  }, []);
  const toggleFlash = useCallback(() => setFlashOn((v) => !v), []);
  const toggleTorch = useCallback(() => setTorchOn((v) => !v), []);

  // lightweight zoom smoothing
  const setZoomSmooth = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(1, target));
    if (Math.abs(clamped - zoom) < 0.001) {
      setZoom(clamped);
      return;
    }
    const start = zoom;
    const delta = clamped - start;
    const startTime = Date.now();
    const duration = 120;

    let raf: number;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = start + delta * (1 - Math.pow(1 - t, 3));
      setZoom(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      if (Platform.OS === 'web' && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(raf);
      }
    };
  }, [zoom]);

  const makeId = useCallback(
    () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  // —— PHOTO CAPTURE -> push into DraftsContext.add() ——
  const takePhoto = useCallback(async (): Promise<MediaItem | void> => {
    if (!canTakePhoto) return;
    if (!(await ensureCameraPermission())) return;

    const cam = cameraRef.current as any;
    if (!cam?.takePictureAsync) return;

    const captured = await cam.takePictureAsync?.({ skipProcessing: true });
    if (!captured?.uri) return;

    const media: MediaItem = {
      id: makeId(),
      uri: captured.uri,
      type: 'photo',
      width: typeof captured.width === 'number' ? captured.width : undefined,
      height: typeof captured.height === 'number' ? captured.height : undefined,
      durationMs: undefined,
      createdAt: Date.now(),
    };

    add(media);
    return media;
  }, [add, canTakePhoto, ensureCameraPermission, makeId]);

  // —— VIDEO (lean) ——
  const startVideo = useCallback(
    async (opts?: { maxMs?: number }) => {
      if (isRecording) return;
      const ok = await ensureVideoPermissions();
      if (!ok) return;

      const cam = cameraRef.current as any;
      if (!cam) return;

      setIsRecording(true);
      const maxMs = Math.max(1000, Math.min(60_000, opts?.maxMs ?? 10_000));

      if (typeof cam.startRecording === 'function') {
        let stopTimer: ReturnType<typeof setTimeout> | undefined;
        try {
          await new Promise<void>((resolve, reject) => {
            try {
              cam.startRecording({
                maxDuration: Math.ceil(maxMs / 1000),
                onRecordingFinished: () => resolve(),
                onRecordingError: (e: unknown) => reject(e),
              });
              stopTimer = setTimeout(() => {
                try { cam.stopRecording?.(); } catch {}
              }, maxMs + 200);
            } catch (e) {
              reject(e);
            }
          });
        } finally {
          if (stopTimer) clearTimeout(stopTimer);
          setIsRecording(false);
        }
      } else if (typeof cam.recordAsync === 'function') {
        const stopper = setTimeout(() => {
          try { cam.stopRecording?.(); } catch {}
        }, maxMs + 200);
        try {
          await cam.recordAsync({ maxDuration: Math.ceil(maxMs / 1000) });
        } finally {
          clearTimeout(stopper);
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    },
    [ensureVideoPermissions, isRecording]
  );

  const stopVideo = useCallback(async () => {
    if (!isRecording) return;
    const cam = cameraRef.current as any;
    try {
      cam?.stopRecording?.();
    } finally {
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    cameraRef,
    facing,
    flashOn,
    torchOn,
    zoom,
    isRecording,
    canTakePhoto,

    flashMode,

    flip,
    toggleFlash,
    toggleTorch,
    setZoomSmooth,
    takePhoto,
    startVideo,
    stopVideo,
  };
}
