/**
 * FitPics list for another user's profile (public / view-only tab).
 * Separate from useUserFitPics — same API contract, independent implementation.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { fitpicClient } from "../services/apiClients/fitpicClient";
import type { FitPic } from "../types/fitpic";

export type PublicProfileFitPicsState = {
  fitpics: FitPic[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  nextCursor?: string;
};

export const usePublicProfileFitPics = (userId: string) => {
  const isFirstFocus = useRef(true);
  const [state, setState] = useState<PublicProfileFitPicsState>({
    fitpics: [],
    loading: true,
    refreshing: false,
    hasMore: true,
    error: null,
    nextCursor: undefined,
  });

  const loadFitPics = useCallback(async (refresh = false) => {
    if (!userId) {
      setState((prev) => ({ ...prev, loading: false, refreshing: false }));
      return;
    }

    if (refresh) {
      setState((prev) => ({ ...prev, refreshing: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await fitpicClient.listByUser(
        userId,
        refresh ? undefined : state.nextCursor,
        20
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          fitpics: refresh ? response.fitpics : [...prev.fitpics, ...response.fitpics],
          hasMore: response.pagination?.hasMore ?? false,
          nextCursor: response.pagination?.nextCursor,
          loading: false,
          refreshing: false,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: response.error || "Failed to load fit pics",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : "Failed to load fit pics",
      }));
    }
  }, [userId, state.nextCursor]);

  const refresh = useCallback(() => {
    loadFitPics(true);
  }, [loadFitPics]);

  const loadMore = useCallback(() => {
    if (!state.loading && !state.refreshing && state.hasMore) {
      loadFitPics(false);
    }
  }, [loadFitPics, state.loading, state.refreshing, state.hasMore]);

  useEffect(() => {
    if (!userId) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    loadFitPics();
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (userId) refresh();
    }, [userId, refresh])
  );

  return {
    ...state,
    refresh,
    loadMore,
  };
};
