import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { CAPTION_MAX, PostMeta } from './types';

export type PostContextValue = {
  meta: PostMeta;                     // { caption, productIds, updatedAt }
  setCaption(text: string): void;     // silently truncates to 2200
  addProduct(id: string): void;       // dedupes
  removeProduct(id: string): void;
  clearAll(): void;                   // clears caption + products
  saveToStorage(): Promise<void>;     // optional (no-op for now)
  loadFromStorage(): Promise<void>;   // optional (no-op for now)
};

const initialMeta: PostMeta = {
  caption: '',
  productIds: [],
  updatedAt: Date.now(),
};

const PostContext = createContext<PostContextValue | null>(null);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meta, setMeta] = useState<PostMeta>(initialMeta);

  const setCaption = useCallback((text: string) => {
    const nextCaption = (text ?? '').slice(0, CAPTION_MAX);
    setMeta(prev =>
      nextCaption === prev.caption
        ? prev
        : { ...prev, caption: nextCaption, updatedAt: Date.now() }
    );
  }, []);

  const addProduct = useCallback((id: string) => {
    if (!id) return;
    setMeta(prev => {
      if (prev.productIds.includes(id)) return prev;
      return {
        ...prev,
        productIds: [...prev.productIds, id],
        updatedAt: Date.now(),
      };
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setMeta(prev => {
      const next = prev.productIds.filter(p => p !== id);
      if (next.length === prev.productIds.length) return prev;
      return { ...prev, productIds: next, updatedAt: Date.now() };
    });
  }, []);

  const clearAll = useCallback(() => {
    setMeta({ caption: '', productIds: [], updatedAt: Date.now() });
  }, []);

  // Optional persistence (Task 10 can wire this to AsyncStorage)
  const saveToStorage = useCallback(async () => {
    // no-op placeholder
  }, [meta]);

  const loadFromStorage = useCallback(async () => {
    // no-op placeholder
  }, []);

  const value = useMemo<PostContextValue>(
    () => ({
      meta,
      setCaption,
      addProduct,
      removeProduct,
      clearAll,
      saveToStorage,
      loadFromStorage,
    }),
    [meta, setCaption, addProduct, removeProduct, clearAll, saveToStorage, loadFromStorage]
  );

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

export function usePostContext(): PostContextValue {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error('usePostContext must be used within a PostProvider');
  return ctx;
}
