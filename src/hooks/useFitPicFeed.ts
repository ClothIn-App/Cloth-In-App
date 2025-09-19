/**
 * Hook for fetching FitPic feeds
 * Handles For You, Following, and Trending feeds
 */

import { useEffect, useState, useCallback } from 'react';
import { getFeedFitPics, updateFitPicEngagement } from '../services/fitpicApi';
import type { FitPic, FeedType, GetFeedRequest } from '../types/fitpic';

export type FeedState = {
  fitpics: FitPic[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  nextCursor?: string;
};

export const useFitPicFeed = (type: FeedType) => {
  const [state, setState] = useState<FeedState>({
    fitpics: [],
    loading: true,
    refreshing: false,
    hasMore: true,
    error: null,
    nextCursor: undefined,
  });

  const loadFeed = useCallback(async (refresh = false) => {
    if (refresh) {
      setState(prev => ({ ...prev, refreshing: true, error: null }));
    } else {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const request: GetFeedRequest = {
        type,
        cursor: refresh ? undefined : state.nextCursor,
        limit: 20,
      };

      const response = await getFeedFitPics(request);

      if (response.success) {
        setState(prev => ({
          ...prev,
          fitpics: refresh ? response.fitpics : [...prev.fitpics, ...response.fitpics],
          hasMore: response.pagination.hasMore,
          nextCursor: response.pagination.nextCursor,
          loading: false,
          refreshing: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: response.error || 'Failed to load feed',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: error instanceof Error ? error.message : 'Failed to load feed',
      }));
    }
  }, [type, state.nextCursor]);

  const refresh = useCallback(() => {
    loadFeed(true);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!state.loading && !state.refreshing && state.hasMore) {
      loadFeed(false);
    }
  }, [loadFeed, state.loading, state.refreshing, state.hasMore]);

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
    loadFeed();
  }, [type]); // Reload when feed type changes

  return {
    ...state,
    refresh,
    loadMore,
    handleLike,
    handleSave,
  };
};
