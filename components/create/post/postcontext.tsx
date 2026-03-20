import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CAPTION_MAX, ProductLite } from './types';

type PostMeta = { caption: string; products: ProductLite[]; location: string; tags: string[] };

export type PostContextValue = {
  meta: PostMeta;
  setCaption: (v: string) => void;      // silently truncates to CAPTION_MAX
  setLocation: (v: string) => void;
  addProduct: (p: ProductLite) => void;
  removeProduct: (id: string) => void;
  /** Replace the entire tags array (dedupe + lowercase handled here) */
  setTags: (tags: string[]) => void;
  /** Remove a single tag by canonical name (no leading #) */
  removeTag: (tag: string) => void;
  clearMeta: () => void;                 // clears caption, products, location, tags
};

const PostContext = createContext<PostContextValue | null>(null);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<PostMeta>({
    caption: '',
    products: [],
    location: '',
    tags: [],
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

  const setTags = useCallback((tags: string[]) => {
    // Dedupe and canonicalize (lowercase, strip leading #)
    const seen = new Set<string>();
    const canonical: string[] = [];
    for (const t of tags) {
      const c = t.replace(/^#/, '').toLowerCase();
      if (c && !seen.has(c)) { seen.add(c); canonical.push(c); }
    }
    setMeta(prev => {
      const same =
        prev.tags.length === canonical.length &&
        prev.tags.every((t, i) => t === canonical[i]);
      return same ? prev : { ...prev, tags: canonical };
    });
  }, []);

  const removeTag = useCallback((tag: string) => {
    const canonical = tag.replace(/^#/, '').toLowerCase();
    setMeta(prev => {
      const tags = prev.tags.filter(t => t !== canonical);
      return tags.length === prev.tags.length ? prev : { ...prev, tags };
    });
  }, []);

  const clearMeta = useCallback(() => {
    setMeta({ caption: '', products: [], location: '', tags: [] });
  }, []);

  const value = useMemo<PostContextValue>(
    () => ({ meta, setCaption, setLocation, addProduct, removeProduct, setTags, removeTag, clearMeta }),
    [meta, setCaption, setLocation, addProduct, removeProduct, setTags, removeTag, clearMeta]
  );

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export function usePost(): PostContextValue {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error('usePost must be used within a PostProvider');
  return ctx;
}
