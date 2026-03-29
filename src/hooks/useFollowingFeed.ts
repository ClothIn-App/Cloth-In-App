import { useReducer, useCallback, useRef } from "react";
import { contentApiClient } from "../services/apiClients/contentClient";
import { buildFitPicFeed } from "../utils/normalizeFeed";
import type { FeedItem } from "../types/feed";

const PAGE_LIMIT = 20;

export type FeedStatus = "idle" | "loading" | "refreshing" | "loadingMore" | "error";

export type FollowingFeedState = {
  items: FeedItem[];
  nextCursor: string | undefined;
  hasMore: boolean;
  status: FeedStatus;
  error: Error | null;
};

type FeedAction =
  | { type: "LOAD_START" }
  | { type: "REFRESH_START" }
  | { type: "LOAD_MORE_START" }
  | { type: "FIRST_PAGE_SUCCESS"; items: FeedItem[]; nextCursor: string | undefined; hasMore: boolean }
  | { type: "NEXT_PAGE_SUCCESS"; newItems: FeedItem[]; nextCursor: string | undefined; hasMore: boolean }
  | { type: "ERROR"; error: Error };

const initialState: FollowingFeedState = {
  items: [],
  nextCursor: undefined,
  hasMore: true,
  status: "idle",
  error: null,
};

function feedReducer(state: FollowingFeedState, action: FeedAction): FollowingFeedState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, status: "loading", error: null };
    case "REFRESH_START":
      return { ...state, status: "refreshing", error: null };
    case "LOAD_MORE_START":
      return { ...state, status: "loadingMore" };
    case "FIRST_PAGE_SUCCESS":
      return {
        items: action.items,
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        status: "idle",
        error: null,
      };
    case "NEXT_PAGE_SUCCESS": {
      const seenKeys = new Set(state.items.map((i) => `${i.type}:${i.id}`));
      const uniqueNew = action.newItems.filter((i) => !seenKeys.has(`${i.type}:${i.id}`));
      return {
        items: [...state.items, ...uniqueNew],
        nextCursor: action.nextCursor,
        hasMore: action.hasMore,
        status: "idle",
        error: null,
      };
    }
    case "ERROR":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}

export function useFollowingFeed() {
  const [state, dispatch] = useReducer(feedReducer, initialState);

  const generationRef = useRef(0);
  const nextCursorRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);
  const statusRef = useRef<FeedStatus>("idle");

  nextCursorRef.current = state.nextCursor;
  hasMoreRef.current = state.hasMore;
  statusRef.current = state.status;

  const loadFirstPage = useCallback(async (isRefresh = false) => {
    const gen = ++generationRef.current;
    dispatch({ type: isRefresh ? "REFRESH_START" : "LOAD_START" });

    try {
      // Reset cursor on first page / refresh
      const response = await contentApiClient.getFollowingFeed(undefined, PAGE_LIMIT);
      if (gen !== generationRef.current) return;

      const feedItems = await buildFitPicFeed(response?.items);
      if (gen !== generationRef.current) return;

      dispatch({
        type: "FIRST_PAGE_SUCCESS",
        items: feedItems,
        nextCursor: response?.nextCursor ?? undefined,
        hasMore: Boolean(response?.hasMore),
      });
    } catch (err) {
      if (gen !== generationRef.current) return;
      dispatch({
        type: "ERROR",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    const currentStatus = statusRef.current;
    if (
      !hasMoreRef.current ||
      !nextCursorRef.current ||
      currentStatus === "loadingMore" ||
      currentStatus === "loading" ||
      currentStatus === "refreshing"
    ) {
      return;
    }

    const cursor = nextCursorRef.current;
    const gen = ++generationRef.current;
    dispatch({ type: "LOAD_MORE_START" });

    try {
      const response = await contentApiClient.getFollowingFeed(cursor, PAGE_LIMIT);
      if (gen !== generationRef.current) return;

      const feedItems = await buildFitPicFeed(response?.items);
      if (gen !== generationRef.current) return;

      dispatch({
        type: "NEXT_PAGE_SUCCESS",
        newItems: feedItems,
        nextCursor: response?.nextCursor ?? undefined,
        hasMore: Boolean(response?.hasMore),
      });
    } catch (err) {
      if (gen !== generationRef.current) return;
      dispatch({
        type: "ERROR",
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  const refresh = useCallback(() => loadFirstPage(true), [loadFirstPage]);
  const initialize = useCallback(() => loadFirstPage(false), [loadFirstPage]);

  return { state, refresh, initialize, loadNextPage };
}
