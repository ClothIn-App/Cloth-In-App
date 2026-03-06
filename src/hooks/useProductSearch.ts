/**
 * Debounced product search for fitpic product picker.
 * Returns up to 4 ProductLite results and loading state; ignores stale responses.
 */

import { useEffect, useState, useRef } from 'react';
import { searchProducts } from '../services/searchApi';
import type { ProductSearchResult } from '../types/search';
import type { ProductLite } from '../../components/create/post/types';

const DEBOUNCE_MS = 350;
const MAX_RESULTS = 4;

function productSearchResultToLite(p: ProductSearchResult): ProductLite {
  const imageUrl = p.imageUrl ?? p.images?.[0]?.url ?? undefined;
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price ?? undefined,
    imageUrl,
    purchaseUrl: p.purchaseUrl ?? undefined,
  };
}

export function useProductSearch(searchQuery: string): {
  results: ProductLite[];
  loading: boolean;
} {
  const [results, setResults] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);
  const lastRequestedRef = useRef<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      lastRequestedRef.current = '';
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      return;
    }

    debounceRef.current = setTimeout(() => {
      const queryAtRequest = trimmed;
      lastRequestedRef.current = queryAtRequest;
      setLoading(true);

      searchProducts(queryAtRequest, {}, 'relevance', null)
        .then((response) => {
          if (lastRequestedRef.current !== queryAtRequest) return;
          const mapped = (response.items ?? []).map(productSearchResultToLite).slice(0, MAX_RESULTS);
          setResults(mapped);
        })
        .catch(() => {
          if (lastRequestedRef.current !== queryAtRequest) return;
          setResults([]);
        })
        .finally(() => {
          if (lastRequestedRef.current === queryAtRequest) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [searchQuery]);

  return { results, loading };
}
