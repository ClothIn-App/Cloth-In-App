// app/features/fitpic/cameraroll/useSelectionSync.tsx
import { useCallback } from 'react';
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
  const {
    items,               // backing MediaItem list (for id → item mapping)
    has,                 // check if a draft item exists
    add,                 // add a backing MediaItem if needed
    selectedIds,         // ← the real source of truth for selection + order
    addSelected,         // select one or more ids
    removeSelected,      // unselect an id
    setSelectedOrder,    // set the full selection order
  } = useDrafts();

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

  /**
   * Apply a new order to the CURRENT selection.
   * - Dedupes incoming ids
   * - Keeps any selected ids not present in `nextIds` appended in their prior order
   * - No-op if the resulting order is unchanged
   */
  const setOrder = useCallback(
    (nextIds: string[]) => {
      if (!Array.isArray(nextIds) || nextIds.length === 0) return;

      // Only reorder among the current selection; ignore unknown ids.
      const dedupNext = Array.from(new Set(nextIds)).filter((id) =>
        selectedIds.includes(id)
      );
      const remainder = selectedIds.filter((id) => !dedupNext.includes(id));
      const final = [...dedupNext, ...remainder];

      // If order didn't change, bail
      const unchanged =
        final.length === selectedIds.length &&
        final.every((id, i) => id === selectedIds[i]);
      if (unchanged) return;

      setSelectedOrder(final);
    },
    [selectedIds, setSelectedOrder]
  );

  /**
   * Toggle selection for a Camera Roll asset.
   * - If already selected: UNSELECT (do not hard-delete the draft)
   * - If not selected: ensure a backing draft exists, then SELECT and append to order
   * - Enforces max 5 items limit
   */
  const toggle = useCallback(
    (asset: AssetLite) => {
      if (!asset?.id) return;

      // Deselect
      if (isSelected(asset.id)) {
        removeSelected(asset.id);
        return;
      }

      // Check max limit (5 items)
      if (selectedCount >= 5) {
        // Could show an alert here or return early
        return;
      }

      // Ensure a backing MediaItem exists in drafts
      if (!has?.(asset.id)) {
        const mediaItem = {
          id: asset.id,
          uri: asset.uri,
          width: asset.width ?? 0,
          height: asset.height ?? 0,
          createdAt: asset.createdAt ?? Date.now(),
          thumbnailUri: asset.thumbnailUri,
          previewUri: asset.previewUri,
          kind: 'photo',
          source: 'cameraroll',
        } as any; // keep loose here; callers can refine the MediaItem type

        add(mediaItem);
      }

      // Select the id
      addSelected([{ id: asset.id }]);

      // Ensure appended order (in case addSelected doesn't enforce position)
      setSelectedOrder([...selectedIds, asset.id]);
    },
    [add, has, addSelected, removeSelected, setSelectedOrder, selectedIds, isSelected, selectedCount]
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
