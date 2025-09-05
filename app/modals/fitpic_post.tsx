// app/modals/fitpic_post.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDrafts } from '../../src/FitPic/draftcontext';
import { usePostContext } from '../../src/FitPic/post/postcontext';
import { CAPTION_MAX } from '../../src/FitPic/post/types';

type Props = {
  onBackToCamera?: () => void;
  onOpenProductPicker?: () => void;
  onPost?: () => Promise<void> | void; // host only; parent handles real posting
  posting?: boolean;
  onToast?: (msg: string) => void;
  onOpenPreview?: (startIndex: number, ids: string[]) => void;
};

const noop = () => {};
const shorten = (s: string) => (s.length > 18 ? s.slice(0, 8) + '…' + s.slice(-8) : s);

export default function FitPicPostModal({
  onBackToCamera = noop,
  onOpenProductPicker,
  onPost,
  posting = false,
  onToast,
  onOpenPreview,
}: Props) {
  const insets = useSafeAreaInsets();

  // Photos live in DraftsContext now
  const { selectedIds, removeSelected, setSelectedOrder } = useDrafts();

  // Caption + products live in PostContext
  const { meta, setCaption, addProduct, removeProduct, saveToStorage } = usePostContext();

  const caption = meta.caption;
  const productIds = meta.productIds;
  const ids = selectedIds;

  const hasPhotos = ids.length > 0;
  const postDisabled = !hasPhotos || posting;

  const toast = (msg: string) => (onToast ? onToast(msg) : Alert.alert(msg));

  const handleBack = useCallback(() => {
    // No manual sync needed—photo edits are already in DraftsContext.
    onBackToCamera();
  }, [onBackToCamera]);

  const handleSaveDraft = useCallback(async () => {
    await saveToStorage();
    toast('Draft saved');
  }, [saveToStorage]);

  const handlePost = useCallback(async () => {
    if (!onPost) return;
    await onPost();
  }, [onPost]);

  // simple reorder UI (same feel as your old grid’s ↑/↓ controls)
  const [activeForReorder, setActiveForReorder] = useState<number | null>(null);
  const move = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return;
      const next = [...ids];
      const [spliced] = next.splice(from, 1);
      next.splice(to, 0, spliced);
      setSelectedOrder(next);
      setActiveForReorder(to);
    },
    [ids, setSelectedOrder],
  );

  // Tight header under camera cutout + footer just above home indicator
  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 40 + topPad;
  const footerSafePad = insets.bottom;
  const footerInnerExtra = 4;

  // thumbnail size (4-col)
  const tile = useMemo(() => {
    const GAP = 2, PADDING = 2, NUM_COLS = 4;
    const totalGutter = (NUM_COLS - 1) * GAP + PADDING * 2;
    const size = Math.floor((Math.min(420, 800) - totalGutter) / NUM_COLS); // safe default
    return { GAP, PADDING, NUM_COLS, size };
  }, []);

  return (
    <SafeAreaView style={S.root} edges={['left', 'right']}>
      {/* Header (white bg, black text, tight under camera) */}
      <View style={[S.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={handleBack} hitSlop={10} style={S.headerBtn}>
          <Text style={S.headerBtnText}>Back</Text>
        </Pressable>

        <Text style={S.title}>Create Post</Text>

        <Pressable onPress={handleSaveDraft} hitSlop={10} style={S.headerBtn}>
          <Text style={[S.headerBtnText, S.save]}>Save Draft</Text>
        </Pressable>
      </View>

      {/* Body */}
      <ScrollView style={S.body} contentContainerStyle={S.bodyContent}>
        {/* Photos */}
        <Section title="Photos">
          {hasPhotos ? (
            <>
              <View style={[S.gridWrap, { paddingHorizontal: tile.PADDING, marginTop: tile.GAP }]}>
                <View style={S.grid}>
                  {ids.map((id, index) => {
                    const isCover = index === 0;
                    const isActive = activeForReorder === index;
                    const isEnd = (index + 1) % tile.NUM_COLS === 0;
                    return (
                      <View
                        key={id}
                        style={[
                          S.tileWrap,
                          {
                            width: tile.size,
                            height: tile.size,
                            marginRight: isEnd ? 0 : tile.GAP,
                            marginBottom: tile.GAP,
                          },
                        ]}
                      >
                        <Pressable
                          onPress={() => onOpenPreview?.(index, ids)}
                          onLongPress={() => setActiveForReorder(isActive ? null : index)}
                          delayLongPress={250}
                          style={[S.tile, isCover && S.coverBorder, isActive && S.activeOutline]}
                        >
                          <Image source={{ uri: id }} style={{ width: '100%', height: '100%' }} />
                          {/* Remove “x” */}
                          <Pressable
                            onPress={() => removeSelected(id)}
                            style={S.closeBtn}
                            hitSlop={8}
                          >
                            <Text style={S.closeTxt}>×</Text>
                          </Pressable>

                          {/* Cover badge */}
                          {isCover && (
                            <View style={S.coverBadge}>
                              <Text style={S.coverTxt}>Cover</Text>
                            </View>
                          )}

                          {/* Reorder controls */}
                          {isActive && (
                            <View style={S.reorderBar}>
                              <Pressable
                                onPress={() => move(index, Math.max(0, index - 1))}
                                style={S.arrowBtn}
                                hitSlop={8}
                              >
                                <Text style={S.arrowTxt}>↑</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => move(index, Math.min(ids.length - 1, index + 1))}
                                style={S.arrowBtn}
                                hitSlop={8}
                              >
                                <Text style={S.arrowTxt}>↓</Text>
                              </Pressable>
                              <Pressable onPress={() => setActiveForReorder(null)} hitSlop={8}>
                                <Text style={S.doneTxt}>Done</Text>
                              </Pressable>
                            </View>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </View>
              <Text style={S.help}>
                Tip: Long-press a tile for quick Up/Down reordering. The first tile is the cover.
              </Text>
            </>
          ) : (
            <Text style={S.muted}>No photos selected yet.</Text>
          )}
        </Section>

        {/* Products */}
        <Section title="Products">
          {productIds.length ? (
            <View style={S.chipsWrap}>
              {productIds.map((pid) => (
                <View key={pid} style={S.chip}>
                  <Text style={S.chipText}>{shorten(pid)}</Text>
                  <View style={S.chipBtns}>
                    <Pressable onPress={() => removeProduct(pid)} style={S.smallBtn}>
                      <Text style={S.smallBtnTxt}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={S.muted}>No products tagged.</Text>
          )}

          <Pressable onPress={onOpenProductPicker} style={[S.rowBtn, S.rowBtnPrimary]}>
            <Text style={S.rowBtnText}>+ Add product</Text>
          </Pressable>
        </Section>

        {/* Caption */}
        <Section title="Caption">
          <TextInput
            placeholder="Write a caption…"
            value={caption}
            onChangeText={setCaption}
            multiline
            style={S.captionInput}
            maxLength={CAPTION_MAX}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
          <Text style={S.counter}>
            {caption.length}/{CAPTION_MAX}
          </Text>
        </Section>

        {/* Spacer so last content isn't obscured by sticky footer */}
        <View style={{ height: 64 + footerSafePad + footerInnerExtra }} />
      </ScrollView>

      {/* Sticky Footer (sits just above the home indicator) */}
      <SafeAreaView style={[S.footerSafe, { paddingBottom: footerSafePad }]} edges={[]}>
        <View style={[S.footer, { paddingBottom: footerInnerExtra }]}>
          <Pressable
            onPress={handlePost}
            disabled={postDisabled}
            style={[S.postBtn, postDisabled && S.postBtnDisabled]}
          >
            {posting ? <ActivityIndicator /> : <Text style={S.postBtnText}>Post</Text>}
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.section}>
      <Text style={S.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { paddingVertical: 4, paddingHorizontal: 6, minWidth: 64 },
  headerBtnText: { color: '#111827', fontSize: 15 },
  save: { color: '#007aff' },
  title: { flex: 1, textAlign: 'center', color: '#111827', fontSize: 15, fontWeight: '600' },

  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 20, backgroundColor: '#ffffff' },

  section: { gap: 10 },
  sectionTitle: { color: '#111827', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  help: { color: '#6b7280', fontSize: 12, marginTop: 6 },
  muted: { color: '#6b7280', fontSize: 14 },

  gridWrap: { width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tileWrap: {},
  tile: { flex: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: '#eee' },
  coverBorder: { borderWidth: 2, borderColor: '#111' },
  activeOutline: { outlineStyle: 'solid' as any, outlineWidth: 2, outlineColor: '#6aa0ff' },
  closeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 0,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 16, lineHeight: 18, fontWeight: '600' },
  coverBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
  },
  coverTxt: { fontSize: 10, fontWeight: '700', color: '#111' },
  reorderBar: {
    position: 'absolute',
    left: 4,
    top: 4,
    right: 24,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(17,17,17,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  arrowBtn: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  arrowTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  doneTxt: { color: '#fff', marginLeft: 'auto', fontSize: 12, fontWeight: '700' },

  chipsWrap: { gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { color: '#111827', fontSize: 14 },
  chipBtns: { flexDirection: 'row', gap: 8 },
  smallBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  smallBtnTxt: { color: '#111827', fontSize: 12 },

  rowBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  rowBtnPrimary: { borderColor: '#2563eb' },
  rowBtnText: { color: '#111827', fontSize: 14, fontWeight: '600' },

  captionInput: {
    minHeight: 120,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#111827',
    fontSize: 14,
  },
  counter: { alignSelf: 'flex-end', color: '#6b7280', fontSize: 12, marginTop: 6 },

  footerSafe: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  postBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  postBtnDisabled: { backgroundColor: '#e5e7eb' },
  postBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
