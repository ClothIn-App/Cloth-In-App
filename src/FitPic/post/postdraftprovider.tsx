// app/src/FitPic/post/PostDraftProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PostDraft, PostDraftStatus } from './types';

export const MAX_CAPTION_CHARS = 2200;

type Ctx = {
  draft: PostDraft | null;

  // lifecycle
  startFromSelection: (selectedIds: string[]) => void; // preserves exact order
  saveTemp: () => void; // snapshot current draft in-memory (no status change)
  clear: () => void;

  // editors
  setPhotoIds: (next: string[]) => void; // reorder/remove
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  setCaption: (text: string) => void; // silently capped to 2200
  setStatus: (s: PostDraftStatus) => void;

  // meta
  isDirty: boolean; // compares against last saved snapshot
};

const PostDraftContext = createContext<Ctx | null>(null);

// Tiny id helper (no new deps)
const genId = () =>
  `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export function PostDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PostDraft | null>(null);
  const lastSaved = useRef<PostDraft | null>(null);

  const startFromSelection = useCallback((selectedIds: string[]) => {
    const now = Date.now();
    const initial: PostDraft = {
      id: genId(),
      photoIds: [...selectedIds], // cover = index 0
      caption: '',
      productIds: [],
      status: 'editing',
      createdAt: now,
      updatedAt: now,
    };
    setDraft(initial);
    // new draft starts "unsaved" (no snapshot)
  }, []);

  const setPhotoIds = useCallback((next: string[]) => {
    setDraft(prev =>
      prev ? { ...prev, photoIds: [...next], updatedAt: Date.now() } : prev,
    );
  }, []);

  const addProduct = useCallback((id: string) => {
    setDraft(prev => {
      if (!prev) return prev;
      if (prev.productIds.includes(id)) return prev;
      return {
        ...prev,
        productIds: [...prev.productIds, id],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setDraft(prev =>
      prev
        ? {
            ...prev,
            productIds: prev.productIds.filter(x => x !== id),
            updatedAt: Date.now(),
          }
        : prev,
    );
  }, []);

  const setCaption = useCallback((text: string) => {
    const LIMITED = text.slice(0, MAX_CAPTION_CHARS);
    setDraft(prev => (prev ? { ...prev, caption: LIMITED, updatedAt: Date.now() } : prev));
  }, []);

  const saveTemp = useCallback(() => {
    // In-memory snapshot; keep whatever status you're in ('editing' or 'posting')
    setDraft(prev => {
      if (!prev) return prev;
      const saved: PostDraft = { ...prev, updatedAt: Date.now() };
      lastSaved.current = saved;
      return saved;
    });
  }, []);

  const clear = useCallback(() => {
    setDraft(null);
    lastSaved.current = null;
  }, []);

  const setStatus = useCallback((s: PostDraftStatus) => {
    setDraft(prev => (prev ? { ...prev, status: s, updatedAt: Date.now() } : prev));
  }, []);

  const isDirty = useMemo(() => {
    const a = draft;
    const b = lastSaved.current;
    if (!a && !b) return false;
    if (!a || !b) return true;
    // compare only meaningful fields
    return (
      a.caption !== b.caption ||
      a.status !== b.status ||
      a.photoIds.join('|') !== b.photoIds.join('|') ||
      a.productIds.join('|') !== b.productIds.join('|')
    );
  }, [draft]);

  const value: Ctx = {
    draft,
    startFromSelection,
    saveTemp,
    clear,
    setPhotoIds,
    addProduct,
    removeProduct,
    setCaption,
    setStatus,
    isDirty,
  };

  return <PostDraftContext.Provider value={value}>{children}</PostDraftContext.Provider>;
}

export function usePostDraft(): Ctx {
  const ctx = useContext(PostDraftContext);
  if (!ctx) throw new Error('usePostDraft must be used within a PostDraftProvider');
  return ctx;
}