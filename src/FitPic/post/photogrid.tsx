// app/src/FitPic/post/PhotoGrid.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable, Image, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { usePostDraft } from './postdraftprovider';

type Props = {
  onOpenPreview?: (startIndex: number, ids: string[]) => void;
  renderThumb?: (id: string, size: number) => React.ReactNode;
};

const NUM_COLS = 4;
const GAP = 2;
const PADDING = 2;

export default function PhotoGrid({ onOpenPreview, renderThumb }: Props) {
  const { draft, setPhotoIds } = usePostDraft();
  const ids = draft?.photoIds ?? [];
  const { width } = useWindowDimensions();
  const [activeForReorder, setActiveForReorder] = useState<number | null>(null);

  const tile = useMemo(() => {
    const totalGutter = (NUM_COLS - 1) * GAP + PADDING * 2;
    const size = Math.floor((width - totalGutter) / NUM_COLS);
    return { size };
  }, [width]);

  const setOrder = useCallback((next: string[]) => setPhotoIds(next), [setPhotoIds]);

  const removeAt = useCallback(
    (index: number) => {
      setOrder(ids.filter((_, i) => i !== index));
      if (activeForReorder === index) setActiveForReorder(null);
    },
    [ids, setOrder, activeForReorder],
  );

  const move = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return;
      const next = [...ids];
      const [spliced] = next.splice(from, 1);
      next.splice(to, 0, spliced);
      setOrder(next);
      setActiveForReorder(to);
    },
    [ids, setOrder],
  );

  if (!draft || ids.length === 0) return null;

  return (
    <View style={[S.container, { paddingHorizontal: PADDING }]}>
      <View style={[S.grid, { marginTop: GAP }]}>
        {ids.map((id, index) => {
          const isCover = index === 0;
          const isActive = activeForReorder === index;
          const isEndOfRow = (index + 1) % NUM_COLS === 0;

          return (
            <View
              key={id}
              style={[
                S.tileWrap,
                {
                  width: tile.size,
                  height: tile.size,
                  marginRight: isEndOfRow ? 0 : GAP,
                  marginBottom: GAP,
                },
              ]}
            >
              <Pressable
                onPress={() => onOpenPreview?.(index, ids)}
                onLongPress={() => setActiveForReorder(isActive ? null : index)}
                delayLongPress={250}
                style={[S.tile, isCover && S.coverBorder, isActive && S.activeOutline]}
              >
                {renderThumb ? (
                  renderThumb(id, tile.size)
                ) : (
                  <Image source={{ uri: id }} style={{ width: '100%', height: '100%' }} />
                )}

                {/* Remove “x” */}
                <Pressable onPress={() => removeAt(index)} style={S.closeBtn} hitSlop={8}>
                  <Text style={S.closeTxt}>×</Text>
                </Pressable>

                {/* Cover badge */}
                {isCover && (
                  <View style={S.coverBadge}>
                    <Text style={S.coverTxt}>Cover</Text>
                  </View>
                )}

                {/* Reorder controls (shown after long-press) */}
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
  );
}

const S = StyleSheet.create({
  container: { width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tileWrap: {},
  tile: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#eee',
  },
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
});