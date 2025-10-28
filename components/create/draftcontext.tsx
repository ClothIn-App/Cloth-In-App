import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MediaItem } from './camera/media';

// Minimal asset shape used by selection API.
// (Structural typing means callers can pass richer objects.)
type AssetLite = { id: string };

type AddResult =
  | { ok: true }
  | { ok: false; reason: 'full' | 'duplicate' };

type DraftsContextValue = {
  // ---- existing drafts store ----
  drafts: MediaItem[];
  items: MediaItem[];                // alias
  add: (item: MediaItem) => AddResult;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  isFull: boolean;
  max: number;
  has: (id: string) => boolean;

  // ---- NEW: selection API ----
  selectedIds: string[];                           
  addSelected: (assets: AssetLite[]) => void;          
  removeSelected: (assetId: string) => void;          
  setSelectedOrder: (assetIds: string[]) => void;       
};

const DraftsContext = createContext<DraftsContextValue | null>(null);

export function DraftsProvider({ children }: { children: ReactNode }) {
  // drafts store (unchanged behavior)
  const [drafts, setDrafts] = useState<MediaItem[]>([]);
  // ordered list of selected asset ids (camera/camera roll)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const add = useCallback((item: MediaItem): AddResult => {
    let added = false;
    setDrafts(prev => {
      if (prev.some(d => d.id === item.id)) return prev;
      added = true;
      return [...prev, item];
    });
    return added ? { ok: true } : { ok: false, reason: 'duplicate' };
  }, []);

  const remove = useCallback((id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
    // also unselect if it was selected
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  }, []);

  const clear = useCallback(() => {
    setDrafts([]);
    setSelectedIds([]);
  }, []);

  const has = useCallback(
    (id: string) => drafts.some(d => d.id === id),
    [drafts]
  );

  // ---- selection API ----

  const addSelected = useCallback((assets: AssetLite[]) => {
    if (!assets?.length) return;
    setSelectedIds(prev => {
      const seen = new Set(prev);
      const toAdd: string[] = [];
      for (const a of assets) {
        const id = a?.id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        toAdd.push(id);
      }
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, []);

  const removeSelected = useCallback((assetId: string) => {
    if (!assetId) return;
    setSelectedIds(prev => (prev.includes(assetId) ? prev.filter(id => id !== assetId) : prev));
  }, []);

  const setSelectedOrder = useCallback((assetIds: string[]) => {
    setSelectedIds(prev => {
      if (!Array.isArray(assetIds)) return prev;
      // Keep only ids that are currently selected; maintain provided order,
      // then append any missing ones in their existing order to avoid data loss.
      const prevSet = new Set(prev);
      const ordered = assetIds.filter(id => prevSet.has(id));
      if (ordered.length === prev.length) return ordered;
      const missing = prev.filter(id => !ordered.includes(id));
      return [...ordered, ...missing];
    });
  }, []);

  const value = useMemo<DraftsContextValue>(
    () => ({
      // drafts
      drafts,
      items: drafts,
      add,
      remove,
      clear,
      count: drafts.length,
      isFull: false,
      max: Number.POSITIVE_INFINITY,
      has,
      // selection
      selectedIds,
      addSelected,
      removeSelected,
      setSelectedOrder,
    }),
    [
      drafts,
      add,
      remove,
      clear,
      has,
      selectedIds,
      addSelected,
      removeSelected,
      setSelectedOrder,
    ]
  );

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts(): DraftsContextValue {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts must be used within a <DraftsProvider>');
  return ctx;
}