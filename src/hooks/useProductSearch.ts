/**
 * Hook for product search in the create/fitpic flow.
 * Fetches product options via API only (no mock JSON) per MOCK_IMPLEMENTATION_GUIDE.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { searchApiClient } from '../services/apiClients/searchClient';
import type { ProductSearchResult } from '../types/search';
import type { ProductLite } from '../components/create/post/types';

const DEBOUNCE_MS = 280;

/** Map ProductSearchResult or search-like item to post ProductLite for CreateFitPicRequest */
export function mapToProductLite(p: ProductSearchResult | { id: string; name: string; brand?: string; category?: string; price?: number | null; currency?: string; imageUrl?: string; purchaseUrl?: string | null }): ProductLite {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price ?? undefined,
    currency: p.currency,
    imageUrl: p.imageUrl,
    purchaseUrl: p.purchaseUrl ?? undefined,
  };
}

export type UseProductSearchOptions = {
  /** When false, no requests are made (e.g. dropdown closed) */
  enabled?: boolean;
};

export function useProductSearch(query: string, options: UseProductSearchOptions = {}) {
  const { enabled = true } = options;
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBySearch = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await searchApiClient.searchProducts({
        q: q.trim(),
        limit: 4,
      });
      setProducts(response.products ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      setLoading(false);
      setError(null);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    const trimmed = query.trim();

    if (trimmed.length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        fetchBySearch(trimmed);
      }, DEBOUNCE_MS);
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
      };
    }

    // Empty or short query: no products until user searches
    setProducts([]);
    setLoading(false);
    setError(null);
  }, [enabled, query, fetchBySearch]);

  return { products, loading, error };
}
