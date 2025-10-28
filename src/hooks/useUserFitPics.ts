/**
 * Hook for fetching user's FitPics
 * Used in account screen and profile views
 */

import { useEffect, useState, useCallback } from 'react';
import { getUserFitPics, updateFitPicEngagement } from '../services/fitpicApi';
import type { FitPic } from '../types/fitpic';

export type UserFitPicsState = {
  fitpics: FitPic[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  nextCursor?: string;
};

export const useUserFitPics = (userId: string) => {
  const [state, setState] = useState<UserFitPicsState>({
    fitpics: [],
    loading: true,
    refreshing: false,
    hasMore: true,
    error: null,
    nextCursor: undefined,
  });

  const loadFitPics = useCallback(async (refresh = false) => {
    if (!userId) return;

    if (refresh) {
      setState(prev => ({ ...prev, refreshing: true, error: null }));
    } else {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const response = await getUserFitPics(
        userId,
        refresh ? undefined : state.nextCursor,
        20
      );

      if (response.success) {
        setState(prev => ({
          ...prev,
          fitpics: refresh ? response.fitpics : [...prev.fitpics, ...response.fitpics],
          hasMore: response.pagination?.hasMore ?? false,
          nextCursor: response.pagination?.nextCursor,
          loading: false,
          refreshing: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: response.error || 'Failed to load fit pics',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load fit pics',
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

  const handleLike = useCallback(async (fitpic: FitPic) => {
    const action = fitpic.engagement.isLiked ? 'unlike' : 'like';
    
    try {
      const response = await updateFitPicEngagement({
        fitpicId: fitpic.id,
        action,
      });

      if (response.success && response.engagement) {
        setState(prev => ({
          ...prev,
          fitpics: prev.fitpics.map(fp =>
            fp.id === fitpic.id
              ? { ...fp, engagement: response.engagement! }
              : fp
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to update like:', error);
    }
  }, []);

  const handleSave = useCallback(async (fitpic: FitPic) => {
    const action = fitpic.engagement.isSaved ? 'unsave' : 'save';
    
    try {
      const response = await updateFitPicEngagement({
        fitpicId: fitpic.id,
        action,
      });

      if (response.success && response.engagement) {
        setState(prev => ({
          ...prev,
          fitpics: prev.fitpics.map(fp =>
            fp.id === fitpic.id
              ? { ...fp, engagement: response.engagement! }
              : fp
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to update save:', error);
    }
  }, []);

  useEffect(() => {
    loadFitPics();
  }, [userId]); // Reload when user changes

  return {
    ...state,
    refresh,
    loadMore,
    handleLike,
    handleSave,
  };
};
