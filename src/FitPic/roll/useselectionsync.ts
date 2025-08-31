// app/features/fitpic/cameraroll/useSelectionSync.ts
import { useCallback, useMemo } from 'react';
import { useDrafts } from '../draftcontext';

// Minimal shape for grid assets coming from Camera Roll
export type AssetLite = {
  id: string;
  uri: string;
  width?: number;
  height?: number;
  createdAt?: number;
  thumbnailUri?: string;
  previewUri?: string;
};

export function useSelectionSync() {
  const { items, add, remove, clear, has } = useDrafts();

  // Ordered selection (backed by DraftsContext insertion order)
  const selectedIds = useMemo(() => items.map((m) => m.id), [items]);
  const selectedCount = selectedIds.length;

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const orderIndex = useCallback(
    (id: string) => {
      const idx = selectedIds.indexOf(id);
      return idx < 0 ? -1 : idx; // 0-based, -1 if not selected
    },
    [selectedIds]
  );

  // Drag-reorder helper. Keeps any pre-existing items (e.g., camera shots)
  // at the front, then applies the deduped nextIds sequence.
  const setOrder = useCallback(
    (nextIds: string[]) => {
      if (!nextIds || nextIds.length === 0) return;

      // Only keep ids we actually have
      const idToItem = new Map(items.map((it) => [it.id, it]));
      const dedupNext = Array.from(
        new Set(nextIds.filter((id) => idToItem.has(id)))
      );

      // Keep current items that weren't part of dedupNext as a fixed prefix
      const prefix = items.map((it) => it.id).filter((id) => !dedupNext.includes(id));

      const finalIds = [...prefix, ...dedupNext];

      // If order didn't change, bail
      const unchanged =
        finalIds.length === items.length &&
        finalIds.every((id, i) => id === items[i].id);
      if (unchanged) return;

      // Rebuild drafts in the new order
      const finalItems = finalIds.map((id) => idToItem.get(id)!).filter(Boolean);
      clear();
      for (const it of finalItems) {
        // `add` expects a MediaItem; we pass through the same objects from context.
        add(it as any);
      }
    },
    [items, add, clear]
  );

  // Toggle selection (append when adding; remove when already selected)
  const toggle = useCallback(
    (asset: AssetLite) => {
      if (!asset?.id) return;

      if (isSelected(asset.id)) {
        remove(asset.id);
        // After removal, numbering automatically renumbers because it’s index-based.
        return;
      }

      // Map AssetLite -> MediaItem (minimal fields; rest optional)
      const mediaItem = {
        id: asset.id,
        uri: asset.uri,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        createdAt: asset.createdAt ?? Date.now(),
        // keep any provided thumbs/previews for your UI
        thumbnailUri: asset.thumbnailUri,
        previewUri: asset.previewUri,
        // harmless extra metadata others may read
        kind: 'photo',
        source: 'cameraroll',
      } as any;

      // `add` is de-dupe safe; it will no-op if id already exists.
      add(mediaItem);

      // Appending automatically places it after any pre-existing camera shots.
      // No explicit setOrder needed here.
    },
    [add, remove, isSelected]
  );

  return {
    selectedIds,
    selectedCount,
    isSelected,
    orderIndex,
    toggle,
    setOrder,
  };
}
