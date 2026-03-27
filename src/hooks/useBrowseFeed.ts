import { useReducer, useCallback, useRef } from 'react';
import { contentApiClient } from '../services/apiClients/contentClient';
import { buildBrowseFeed } from '../utils/normalizeFeed';
import type { ProductItem } from '../types/feed';

const PAGE_LIMIT = 20;

export type FeedStatus = 'idle' | 'loading' | 'refreshing' | 'loadingMore' | 'error';

export type BrowseFeedState = {
  items: ProductItem[];
  nextCursor: string | undefined;
  hasMore: boolean;
  status: FeedStatus;
  error: Error | null;
};

type FeedAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_MORE_START' }
  | { type: 'FIRST_PAGE_SUCCESS'; items: ProductItem[]; nextCursor: string | undefined; hasMore: boolean }
  | { type: 'NEXT_PAGE_SUCCESS'; newItems: ProductItem[]; nextCursor: string | undefined; hasMore: boolean }
  | { type: 'ERROR'; error: Error };

const initialState: BrowseFeedState = {
  items: [],
  nextCursor: undefined,
  hasMore: true,
  status: 'idle',
  error: null,
};

function feedReducer(state: BrowseFeedState, action: FeedAction): BrowseFeedState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };
    case 'REFRESH_START':
      return { ...state, status: 'refreshing', error: null };
    case 'LOAD_MORE_START':
      return { ...state, status: 'loadingMore' };
    case 'FIRST_PAGE_SUCCESS':
      return {
        items: action.items,
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        status: 'idle',
        error: null,
      };
    case 'NEXT_PAGE_SUCCESS': {
      const seenIds = new Set(state.items.map(i => i.id));
      const uniqueNew = action.newItems.filter(i => !seenIds.has(i.id));
      return {
        items: [...state.items, ...uniqueNew],
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        status: 'idle',
        error: null,
      };
    }
    case 'ERROR':
      return { ...state, status: 'error', error: action.error };
    default:
      return state;
  }
}

export function useBrowseFeed() {
  const [state, dispatch] = useReducer(feedReducer, initialState);

  // Incremented on every new request; used to discard stale responses.
  const generationRef = useRef(0);

  // Refs shadow the latest state values so callbacks can read them without
  // stale-closure issues while remaining stable references.
  const nextCursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  const statusRef = useRef<FeedStatus>('idle');

  nextCursorRef.current = state.nextCursor;
  hasMoreRef.current = state.hasMore;
  statusRef.current = state.status;

  const loadFirstPage = useCallback(async (isRefresh = false) => {
    const gen = ++generationRef.current;
    dispatch({ type: isRefresh ? 'REFRESH_START' : 'LOAD_START' });

    try {
      const response = await contentApiClient.getBrowse({ limit: PAGE_LIMIT });
      if (gen !== generationRef.current) return;

      const feedItems = await buildBrowseFeed(response?.items);
      if (gen !== generationRef.current) return;

      dispatch({
        type: 'FIRST_PAGE_SUCCESS',
        items: feedItems,
        nextCursor: response?.pagination?.nextCursor,
        hasMore: Boolean(response?.pagination?.hasMore),
      });
    } catch (err) {
      if (gen !== generationRef.current) return;
      dispatch({
        type: 'ERROR',
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    const currentStatus = statusRef.current;
    if (
      !hasMoreRef.current ||
      !nextCursorRef.current ||
      currentStatus === 'loadingMore' ||
      currentStatus === 'loading' ||
      currentStatus === 'refreshing'
    ) {
      return;
    }

    const cursor = nextCursorRef.current;
    const gen = ++generationRef.current;
    dispatch({ type: 'LOAD_MORE_START' });

    try {
      const response = await contentApiClient.getBrowse({ limit: PAGE_LIMIT, cursor });
      if (gen !== generationRef.current) return;

      const feedItems = await buildBrowseFeed(response?.items);
      if (gen !== generationRef.current) return;

      dispatch({
        type: 'NEXT_PAGE_SUCCESS',
        newItems: feedItems,
        nextCursor: response?.pagination?.nextCursor,
        hasMore: Boolean(response?.pagination?.hasMore),
      });
    } catch (err) {
      if (gen !== generationRef.current) return;
      dispatch({
        type: 'ERROR',
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  const refresh = useCallback(() => loadFirstPage(true), [loadFirstPage]);
  const initialize = useCallback(() => loadFirstPage(false), [loadFirstPage]);

  return { state, refresh, initialize, loadNextPage };
}
