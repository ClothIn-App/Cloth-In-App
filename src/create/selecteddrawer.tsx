// app/features/fitpic/SelectedDrawer.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image as RNImage, // keep ONLY for getSize
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { Image as ImageExpo } from 'expo-image'; // use for rendering
import { useDrafts } from './draftcontext';
import type { MediaItem } from './camera/media';

export type SelectedDrawerProps = {
  visible: boolean;
  onRequestClose: () => void;
  onNext: () => void;
  heightPct?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  items?: MediaItem[];
  onRemove?: (id: string) => void;
  onClose?: () => void;
};

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(SCREEN_H * 0.5);

const COLS = 3;
const GAP = 6;
const PADDING_H = 12;

const SelectedDrawer: React.FC<SelectedDrawerProps> = ({
  visible,
  onRequestClose,
  onNext,
  heightPct = 0.7,
  contentContainerStyle,
  items: itemsProp,
  onRemove: onRemoveProp,
  onClose,
}) => {
  const {
    items: ctxItems,
    selectedIds,
    removeSelected: ctxRemoveSelected,
  } = useDrafts();

  const items = itemsProp ?? ctxItems;

  const sheetH = SHEET_HEIGHT;

  const baseTranslateY = useRef(new Animated.Value(sheetH)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewFade] = useState(new Animated.Value(0));
  const [previewWH, setPreviewWH] = useState<{ w: number; h: number } | null>(null);

  const data = useMemo(() => {
    const byId = new Map(items.map(m => [m.id, m]));
    return selectedIds
      .map(id => byId.get(id))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [items, selectedIds]);


  const tileSize = useMemo(() => {
    const totalGap = GAP * (COLS - 1) + PADDING_H * 2;
    return Math.floor((SCREEN_W - totalGap) / COLS);
  }, []);

  const openAnim = useCallback(() => {
    dragY.setValue(0);
    Animated.parallel([
      Animated.timing(baseTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [baseTranslateY, backdropOpacity, dragY]);

  const closeAnim = useCallback(
    (cb?: () => void) => {
      Animated.parallel([
        Animated.timing(baseTranslateY, { toValue: sheetH, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        dragY.setValue(0);
        if (finished) cb?.();
      });
    },
    [baseTranslateY, backdropOpacity, sheetH, dragY]
  );

  useEffect(() => {
    if (visible) {
      openAnim();
    } else {
      setPreviewIndex(null);
      baseTranslateY.setValue(sheetH);
      backdropOpacity.setValue(0);
      dragY.setValue(0);
    }
  }, [visible, openAnim, sheetH, baseTranslateY, backdropOpacity, dragY]);

  const handleClose = useCallback(() => {
    closeAnim(onClose ?? onRequestClose);
  }, [closeAnim, onClose, onRequestClose]);

  const onPressTile = useCallback(
    (index: number) => {
      setPreviewIndex(index);
      setPreviewWH(null);

      const item = data[index];
      const w = item?.width ?? 0;
      const h = item?.height ?? 0;

      if (w > 0 && h > 0) {
        setPreviewWH({ w, h });
      } else if (item?.uri) {
        RNImage.getSize(
          item.uri,
          (iw, ih) => setPreviewWH({ w: iw, h: ih }),
          () => setPreviewWH({ w: 1, h: 1 })
        );
      }

      previewFade.setValue(0);
      Animated.timing(previewFade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    },
    [data, previewFade]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => {
      const uri = (item as any).thumbnailUri ?? item.uri;
      return (
        <Pressable
          onPress={() => onPressTile(index)}
          style={[styles.tile, { width: tileSize, height: tileSize }]}
        >
          <ImageExpo
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <Pressable onPress={() => ctxRemoveSelected(item.id)} style={styles.removeBtn} hitSlop={8}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </Pressable>
      );
    },
    [onPressTile, ctxRemoveSelected, tileSize]
  );

  const onGestureEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationY: dragY } }], {
        useNativeDriver: true,
      }),
    [dragY]
  );

  const onHandlerStateChange = useCallback(
    (e: any) => {
      const { state, translationY, velocityY } = e.nativeEvent || {};
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        const shouldClose = translationY > 80 || (velocityY ?? 0) > 1200;
        if (shouldClose) {
          handleClose();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 20,
          }).start();
        }
      }
    },
    [dragY, handleClose]
  );

  const dragClamped = dragY.interpolate({
    inputRange: [-1000, 0, SHEET_HEIGHT],
    outputRange: [0, 0, SHEET_HEIGHT],
    extrapolate: 'clamp',
  });

  const combinedTranslateY = Animated.add(baseTranslateY, dragClamped);

  const PREVIEW_W = Math.round(SCREEN_W * 0.67);
  const aspect = previewWH ? previewWH.h / previewWH.w : 1;
  const PREVIEW_H = Math.max(1, Math.round(PREVIEW_W * aspect));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <GestureHandlerRootView style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { height: SHEET_HEIGHT, transform: [{ translateY: combinedTranslateY }] },
            contentContainerStyle,
          ]}
        >
          <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
            <View style={styles.grabberArea}>
              <View style={styles.grabberBar} />
            </View>
          </PanGestureHandler>

          <View style={styles.header}>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Close</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Selected • {selectedIds.length}</Text>
            <Pressable onPress={onNext} hitSlop={8} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Next</Text>
            </Pressable>
          </View>

          {data.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No items yet</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(m) => m.id}
              renderItem={renderItem}
              numColumns={COLS}
              columnWrapperStyle={{ gap: GAP, paddingHorizontal: PADDING_H }}
              contentContainerStyle={{ gap: GAP, paddingBottom: 24, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Animated.View>

        {previewIndex !== null && data[previewIndex] && (
          <Animated.View style={[styles.previewOverlay, { opacity: previewFade }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewIndex(null)} />
            <View style={styles.previewBox}>
              <ImageExpo
                source={{
                  uri:
                    (data[previewIndex] as any).previewUri ??
                    (data[previewIndex] as any).thumbnailUri ??
                    data[previewIndex].uri,
                }}
                style={{ width: PREVIEW_W, height: PREVIEW_H, borderRadius: 12 }}
                contentFit="contain"
              />
            </View>
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#0f0f10',
    overflow: 'hidden',
  },
  grabberArea: { height: 18, alignItems: 'center', justifyContent: 'center' },
  grabberBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  header: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  headerBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  headerTitle: { fontSize: 16, color: '#fff', opacity: 0.9 },
  tile: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  removeText: { color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 32 },
  emptyText: { color: '#fff', opacity: 0.6 },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: { alignItems: 'center', justifyContent: 'center' },
});

export default React.memo(SelectedDrawer);
