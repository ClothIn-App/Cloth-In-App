/**
 * Paginated FitPics for another user's profile (/user/[userId]).
 * List behavior matches useUserFitPics; no grid-level like/save mutators (Phase 2).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fitpicClient } from '../services/apiClients/fitpicClient';
import type { FitPic } from '../types/fitpic';

export type OtherUserFitPicsState = {
  fitpics: FitPic[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  nextCursor?: string;
};

const emptyState = (): OtherUserFitPicsState => ({
  fitpics: [],
  loading: true,
  refreshing: false,
  hasMore: true,
  error: null,
  nextCursor: undefined,
});

export function useOtherUserFitPics(userId: string) {
  const latestUserIdRef = useRef(userId);
  latestUserIdRef.current = userId;

  const isFirstFocus = useRef(true);
  const [state, setState] = useState<OtherUserFitPicsState>(emptyState);

  const applySuccess = useCallback(
    (
      targetUserId: string,
      replace: boolean,
      newPage: FitPic[],
      pagination: { hasMore?: boolean; nextCursor?: string } | undefined
    ) => {
      if (latestUserIdRef.current !== targetUserId) return;
      setState((prev) => ({
        ...prev,
        fitpics: replace ? newPage : [...prev.fitpics, ...newPage],
        hasMore: pagination?.hasMore ?? false,
        nextCursor: pagination?.nextCursor,
        loading: false,
        refreshing: false,
        error: null,
      }));
    },
    []
  );

  const applyError = useCallback((targetUserId: string, message: string) => {
    if (latestUserIdRef.current !== targetUserId) return;
    setState((prev) => ({
      ...prev,
      loading: false,
      refreshing: false,
      error: message,
    }));
  }, []);

  useEffect(() => {
    if (!userId) {
      setState({
        fitpics: [],
        loading: false,
        refreshing: false,
        hasMore: true,
        error: null,
        nextCursor: undefined,
      });
      return;
    }

    setState(emptyState());
    const targetUserId = userId;

    void (async () => {
      try {
        const response = await fitpicClient.listByUser(targetUserId, undefined, 20);
        if (latestUserIdRef.current !== targetUserId) return;
        if (response.success) {
          applySuccess(targetUserId, true, response.fitpics, response.pagination);
        } else {
          applyError(targetUserId, response.error || 'Failed to load fit pics');
        }
      } catch (error) {
        applyError(
          targetUserId,
          error instanceof Error ? error.message : 'Failed to load fit pics'
        );
      }
    })();
  }, [userId, applySuccess, applyError]);

  const refresh = useCallback(() => {
    const targetUserId = userId;
    if (!targetUserId) return;

    setState((prev) => ({ ...prev, refreshing: true, error: null }));

    void (async () => {
      try {
        const response = await fitpicClient.listByUser(targetUserId, undefined, 20);
        if (latestUserIdRef.current !== targetUserId) return;
        if (response.success) {
          applySuccess(targetUserId, true, response.fitpics, response.pagination);
        } else {
          applyError(targetUserId, response.error || 'Failed to load fit pics');
        }
      } catch (error) {
        applyError(
          targetUserId,
          error instanceof Error ? error.message : 'Failed to load fit pics'
        );
      }
    })();
  }, [userId, applySuccess, applyError]);

  const loadMore = useCallback(() => {
    const targetUserId = userId;
    if (!targetUserId) return;
    if (state.loading || state.refreshing || !state.hasMore) return;

    const cursor = state.nextCursor;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    void (async () => {
      try {
        const response = await fitpicClient.listByUser(targetUserId, cursor, 20);
        if (latestUserIdRef.current !== targetUserId) return;
        if (response.success) {
          applySuccess(targetUserId, false, response.fitpics, response.pagination);
        } else {
          applyError(targetUserId, response.error || 'Failed to load fit pics');
        }
      } catch (error) {
        applyError(
          targetUserId,
          error instanceof Error ? error.message : 'Failed to load fit pics'
        );
      }
    })();
  }, [userId, state.loading, state.refreshing, state.hasMore, state.nextCursor, applySuccess, applyError]);

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
}
