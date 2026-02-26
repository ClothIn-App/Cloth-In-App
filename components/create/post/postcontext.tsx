import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CAPTION_MAX, ProductLite } from './types';

export type PostContextValue = {
  meta: { caption: string; products: ProductLite[]; location: string };
  setCaption: (v: string) => void;      // silently truncates to CAPTION_MAX
  setLocation: (v: string) => void;
  addProduct: (p: ProductLite) => void;
  removeProduct: (id: string) => void;
  clearMeta: () => void;                 // clears caption + products
};

const PostContext = createContext<PostContextValue | null>(null);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<{ caption: string; products: ProductLite[]; location: string }>({
    caption: '',
    products: [],
    location: '',
  });

  const setCaption = useCallback((v: string) => {
    const next = (v ?? '').slice(0, CAPTION_MAX);
    setMeta(prev => (prev.caption === next ? prev : { ...prev, caption: next }));
  }, []);

  const setLocation = useCallback((v: string) => {
    const next = v ?? '';
    setMeta(prev => (prev.location === next ? prev : { ...prev, location: next }));
  }, []);

  const addProduct = useCallback((p: ProductLite) => {
    if (!p?.id) return;
    setMeta(prev =>
      prev.products.some(x => x.id === p.id)
        ? prev
        : { ...prev, products: [...prev.products, p] }
    );
  }, []);

  const removeProduct = useCallback((id: string) => {
    setMeta(prev => {
      const products = prev.products.filter(p => p.id !== id);
      return products.length === prev.products.length ? prev : { ...prev, products };
    });
  }, []);

  const clearMeta = useCallback(() => {
    setMeta({ caption: '', products: [], location: '' });
  }, []);

  const value = useMemo<PostContextValue>(
    () => ({ meta, setCaption, setLocation, addProduct, removeProduct, clearMeta }),
    [meta, setCaption, setLocation, addProduct, removeProduct, clearMeta]
  );

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export function usePost(): PostContextValue {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error('usePost must be used within a PostProvider');
  return ctx;
}
