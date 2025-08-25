// app/features/fitpic/SelectedDrawer.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useDrafts } from './draftcontext';
import type { MediaItem } from './media';

export type SelectedDrawerProps = {
  /** Controls visibility of the bottom-sheet modal. */
  visible: boolean;
  /** Called when user taps Close or backdrop. Parent should set visible=false. */
  onRequestClose: () => void;
  /** Called when user taps Next in the header. */
  onNext: () => void;
  /** Optional: override sheet height (0–1). @default 0.7 (70% of screen height) */
  heightPct?: number;
  /** Optional container style for the sheet. */
  contentContainerStyle?: StyleProp<ViewStyle>;

  // ---- Added to match your call site, but all optional so old uses still work ----
  /** Items to render; if omitted, falls back to DraftsContext.items */
  items?: MediaItem[];
  /** Remove handler; if omitted, falls back to DraftsContext.remove */
  onRemove?: (id: string) => void;
  /** Close handler alias; if provided, used instead of onRequestClose */
  onClose?: () => void;
};

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

const COLS = 3;
const GAP = 6;
const PADDING_H = 12;

/**
 * Bottom sheet modal with:
 * - Header (Close / Next)
 * - Grid of all items (latest first)
 * - Per-tile ✕ remove (from DraftsContext.remove or provided onRemove)
 * - Tap tile -> full-screen preview overlay
 */
const SelectedDrawer: React.FC<SelectedDrawerProps> = ({
  visible,
  onRequestClose,
  onNext,
  heightPct = 0.7,
  contentContainerStyle,
  // added
  items: itemsProp,
  onRemove: onRemoveProp,
  onClose,
}) => {
  // keep context for fallback
  const { items: ctxItems, remove: ctxRemove } = useDrafts();

  // prefer props when provided; otherwise use context
  const items = itemsProp ?? ctxItems;
  const remove = onRemoveProp ?? ctxRemove;

  const sheetH = Math.max(280, Math.min(SCREEN_H * heightPct, SCREEN_H - 80));
  const translateY = useRef(new Animated.Value(sheetH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewFade] = useState(new Animated.Value(0));

  // Sort newest first (latest first)
  const data = useMemo(() => {
    return [...items].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [items]);

  // tile size
  const tileSize = useMemo(() => {
    const totalGap = GAP * (COLS - 1) + PADDING_H * 2;
    return Math.floor((SCREEN_W - totalGap) / COLS);
  }, []);

  const openAnim = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [translateY, backdropOpacity]);

  const closeAnim = useCallback(
    (cb?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: sheetH, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) cb?.();
      });
    },
    [translateY, backdropOpacity, sheetH]
  );

  useEffect(() => {
    if (visible) {
      openAnim();
    } else {
      setPreviewIndex(null);
      translateY.setValue(sheetH);
      backdropOpacity.setValue(0);
    }
  }, [visible, openAnim, sheetH, translateY, backdropOpacity]);

  const handleClose = useCallback(() => {
    // prefer onClose if provided; otherwise use the original onRequestClose
    closeAnim(onClose ?? onRequestClose);
  }, [closeAnim, onClose, onRequestClose]);

  const onPressTile = useCallback(
    (index: number) => {
      setPreviewIndex(index);
      previewFade.setValue(0);
      Animated.timing(previewFade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    },
    [previewFade]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => {
      return (
        <Pressable
          onPress={() => onPressTile(index)}
          style={[styles.tile, { width: tileSize, height: tileSize }]}
        >
          {item.type === 'photo' ? (
            <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={styles.videoStub}>
              <Text style={styles.videoGlyph}>▶︎</Text>
            </View>
          )}

          <Pressable onPress={() => remove(item.id)} style={styles.removeBtn} hitSlop={8}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </Pressable>
      );
    },
    [onPressTile, remove, tileSize]
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: backdropOpacity }]}
        />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetH,
            transform: [{ translateY }],
          },
          contentContainerStyle,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Close</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Selected • {items.length}</Text>

          <Pressable onPress={onNext} hitSlop={8} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Next</Text>
          </Pressable>
        </View>

        {/* Grid */}
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

      {/* Fullscreen preview overlay */}
      {previewIndex !== null && data[previewIndex] && (
        <Animated.View style={[styles.previewOverlay, { opacity: previewFade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewIndex(null)}>
            {data[previewIndex].type === 'photo' ? (
              <Image source={{ uri: data[previewIndex].uri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.previewVideoStub}>
                <Text style={styles.previewVideoGlyph}>▶︎</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
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
  header: {
    height: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
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
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  videoStub: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
  },
  videoGlyph: {
    fontSize: 22,
    color: '#fff',
    opacity: 0.9,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32,
  },
  emptyText: {
    color: '#fff',
    opacity: 0.6,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  previewVideoStub: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewVideoGlyph: {
    fontSize: 60,
    color: '#fff',
    opacity: 0.9,
  },
});

export default React.memo(SelectedDrawer);