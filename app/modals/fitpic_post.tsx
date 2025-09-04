// app/modals/fitpic_post.tsx
import React, { useCallback } from 'react';
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePostDraft, MAX_CAPTION_CHARS } from '../../src/FitPic/post/postdraftprovider';
import type { PostDraft } from '../../src/FitPic/post/types';
import PhotoGrid from '../../src/FitPic/post/photogrid';

type Props = {
  onBackToCamera?: () => void;
  onSyncSelection?: (photoIds: string[]) => void;
  onOpenProductPicker?: () => void;
  onPost?: (draft: PostDraft) => Promise<void> | void;
  posting?: boolean;
  onToast?: (msg: string) => void;
  /** Open your existing full-screen preview (reuse the Selected Drawer preview). */
  onOpenPreview?: (startIndex: number, ids: string[]) => void;
};

const noop = () => {};
const shorten = (s: string) => (s.length > 18 ? s.slice(0, 8) + '…' + s.slice(-8) : s);

export default function FitPicPostModal({
  onBackToCamera = noop,
  onSyncSelection,
  onOpenProductPicker,
  onPost,
  posting = false,
  onToast,
  onOpenPreview,
}: Props) {
  const insets = useSafeAreaInsets();

  const {
    draft,
    setPhotoIds,
    addProduct,
    removeProduct,
    setCaption,
    saveTemp,
    isDirty,
  } = usePostDraft();

  const photoIds = draft?.photoIds ?? [];
  const productIds = draft?.productIds ?? [];
  const caption = draft?.caption ?? '';

  const hasPhotos = photoIds.length > 0;
  const postDisabled = !hasPhotos || posting;

  const toast = (msg: string) => (onToast ? onToast(msg) : Alert.alert(msg));

  const handleBack = useCallback(() => {
    if (draft) onSyncSelection?.(draft.photoIds);
    onBackToCamera();
  }, [draft, onBackToCamera, onSyncSelection]);

  const handleSaveDraft = useCallback(() => {
    saveTemp();
    toast(isDirty ? 'Draft updated' : 'Draft saved');
  }, [saveTemp, isDirty]);

  const handlePost = useCallback(async () => {
    if (!draft) return;
    if (onPost) await onPost(draft);
  }, [draft, onPost]);

  // Photo helpers for quick actions (cover/remove) outside the grid if needed later
  const makeCover = (id: string) => {
    if (!draft) return;
    if (draft.photoIds[0] === id) return;
    const next = [id, ...draft.photoIds.filter(x => x !== id)];
    setPhotoIds(next);
  };
  const removePhoto = (id: string) => {
    if (!draft) return;
    setPhotoIds(draft.photoIds.filter(x => x !== id));
  };

  // Tight header under camera cutout + footer exactly above home indicator
  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 40 + topPad;
  const footerSafePad = insets.bottom;    // clears the home indicator area exactly
  const footerInnerExtra = 4;             // tiny visual gap above the line

  return (
    <SafeAreaView style={S.root} edges={['left', 'right']}>
      {/* Header (white bg, black text, tight under camera) */}
      <View style={[S.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={handleBack} hitSlop={10} style={S.headerBtn}>
          <Text style={S.headerBtnText}>Back</Text>
        </Pressable>

        <Text style={S.title}>Create Post</Text>

        <Pressable onPress={handleSaveDraft} hitSlop={10} style={S.headerBtn}>
          <Text style={[S.headerBtnText, S.save]}>{isDirty ? 'Save Draft*' : 'Save Draft'}</Text>
        </Pressable>
      </View>

      {/* Body */}
      <ScrollView style={S.body} contentContainerStyle={S.bodyContent}>
        {/* Photos */}
        <Section title="Photos">
          {hasPhotos ? (
            <>
              {/* New 4-col grid with remove/reorder + cover styling */}
              <PhotoGrid
                onOpenPreview={(startIndex, ids) => onOpenPreview?.(startIndex, ids)}
              />
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
              {productIds.map(pid => (
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
            maxLength={MAX_CAPTION_CHARS}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
          />
          <Text style={S.counter}>
            {caption.length}/{MAX_CAPTION_CHARS}
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
    paddingBottom: 8, // tiny extra to sit ~4px above the home indicator
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