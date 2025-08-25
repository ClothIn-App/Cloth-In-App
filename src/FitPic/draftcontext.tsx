// app/context/DraftsContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MediaItem } from './media';

/**
 * Result of trying to add an item.
 * Note: 'full' is retained for backward-compat but is never returned anymore.
 */
type AddResult =
  | { ok: true }
  | { ok: false; reason: 'full' | 'duplicate' };

type DraftsContextValue = {
  /** Current in-memory drafts (lost when provider unmounts/reloads). */
  drafts: MediaItem[];
  /** Add a new draft (fails only if duplicate id). */
  add: (item: MediaItem) => AddResult;
  /** Alias for drafts (legacy). */
  items: MediaItem[];
  /** Remove a draft by id (no-op if not found). */
  remove: (id: string) => void;
  /** Clear all drafts. */
  clear: () => void;
  /** Convenience: number of drafts. */
  count: number;
  /** No cap anymore; always false. */
  isFull: boolean;
  /** @deprecated No max; set to Infinity for backward-compat. */
  max: number;
  /** Check if a draft with this id exists. */
  has: (id: string) => boolean;
};

const DraftsContext = createContext<DraftsContextValue | null>(null);

export function DraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<MediaItem[]>([]);

  const add = useCallback((item: MediaItem): AddResult => {
    // Always push unless it's a duplicate id.
    let added = false;
    setDrafts((prev) => {
      if (prev.some((d) => d.id === item.id)) {
        return prev; // duplicate
      }
      added = true;
      return [...prev, item];
    });
    return added ? { ok: true } : { ok: false, reason: 'duplicate' };
  }, []);

  const remove = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clear = useCallback(() => {
    setDrafts([]);
  }, []);

  const has = useCallback(
    (id: string) => drafts.some((d) => d.id === id),
    [drafts]
  );

  const value = useMemo<DraftsContextValue>(() => {
    return {
      drafts,
      items: drafts,
      add,
      remove,
      clear,
      count: drafts.length,
      isFull: false, // no cap
      max: Number.POSITIVE_INFINITY, // deprecated; keeps UI from showing "/5"
      has,
    };
  }, [drafts, add, remove, clear, has]);

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

/** Access the in-memory drafts store. Must be used within <DraftsProvider>. */
export function useDrafts(): DraftsContextValue {
  const ctx = useContext(DraftsContext);
  if (!ctx) {
    throw new Error('useDrafts must be used within a <DraftsProvider>');
  }
  return ctx;
}
