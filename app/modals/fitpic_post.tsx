// app/modals/fitpic_post.tsx
import React, { useCallback } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'; // ← added

import { useDrafts } from '../../src/FitPic/draftcontext';
import { usePost } from '../../src/FitPic/post/postcontext';
import { CAPTION_MAX } from '../../src/FitPic/post/types';

// 🔽 Drop-in grid built for this modal
import PhotoGrid from '../../src/FitPic/post/photogrid';

type Props = {
  onBackToCamera?: () => void;
  onOpenProductPicker?: () => void;
  onPost?: () => Promise<void> | void;
  posting?: boolean;
  onToast?: (msg: string) => void;
  onOpenPreview?: (startIndex: number, ids: string[]) => void;
};

// removed noop
const shorten = (s: string) => (s.length > 18 ? s.slice(0, 8) + '…' + s.slice(-8) : s);

export default function FitPicPostModal({
  onBackToCamera, // ← removed default (= noop)
  onOpenProductPicker,
  onPost,
  posting = false,
  onToast,
  onOpenPreview,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter(); // ← added

  // Photos live in DraftsContext
  const { selectedIds, removeSelected, setSelectedOrder } = useDrafts();

  // Caption + products live in PostContext
  const { meta, setCaption, removeProduct } = usePost();

  const caption = meta.caption ?? '';
  const products = meta.products ?? [];

  const hasPhotos = selectedIds.length > 0;
  const postDisabled = !hasPhotos || posting;

  const toast = (msg: string) => (onToast ? onToast(msg) : Alert.alert(msg));

  const handleBack = useCallback(() => {
    if (onBackToCamera) {
      onBackToCamera();
    } else {
      router.back(); // fallback to native swipe-back behavior
    }
  }, [onBackToCamera, router]);

  // Task 5: Save Draft is a no-op placeholder (wire storage later)
  const handleSaveDraft = useCallback(() => {
    toast('Draft saved (placeholder)');
  }, [toast]);

  const handlePost = useCallback(async () => {
    if (!onPost) return;
    await onPost();
  }, [onPost]);

  // Adapt PhotoGrid’s onOpenPreview(id) -> modal’s (index, ids)
  const handleOpenPreview = useCallback(
    (id: string) => {
      const i = selectedIds.indexOf(id);
      if (i >= 0) onOpenPreview?.(i, selectedIds);
    },
    [onOpenPreview, selectedIds],
  );

  // Tight header under camera + footer above home indicator
  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 40 + topPad;
  const footerSafePad = insets.bottom;
  const footerInnerExtra = 4;

  return (
    <SafeAreaView style={S.root} edges={['left', 'right']}>
      {/* Header (white bg, black text, tight) */}
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
              <PhotoGrid
                selectedIds={selectedIds}
                onOpenPreview={handleOpenPreview}
                removeSelected={removeSelected}
                setSelectedOrder={setSelectedOrder}
              />
              <Text style={S.help}>
                Tip: Use ↑/↓ on a tile to reorder. The first tile is the cover.
              </Text>
            </>
          ) : (
            <Text style={S.muted}>No photos selected yet.</Text>
          )}
        </Section>

        {/* Products */}
        <Section title="Products">
          {products.length ? (
            <View style={S.chipsWrap}>
              {products.map((p) => (
                <View key={p.id} style={S.chip}>
                  <Text style={S.chipText}>{p.name ?? shorten(p.id)}</Text>
                  <Pressable onPress={() => removeProduct(p.id)} style={S.smallBtn}>
                    <Text style={S.smallBtnTxt}>Remove</Text>
                  </Pressable>
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

      {/* Sticky Footer */}
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