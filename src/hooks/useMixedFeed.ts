/**
 * useMixedFeed Hook
 * Manages both fitpics and products data for the home feed
 * Provides unified loading states and data management
 */

import { useState, useEffect, useCallback } from 'react';
import type { FitPic } from '../types/fitpic';
import type { ProductSearchResult, ProductPriceStatus } from '../types/search';
import { contentApiClient } from '../services/apiClients/contentClient';

type FeedType = 'forYou' | 'following';

// Helper function to cast products data with proper typing
const castProductsData = (products: any[]): ProductSearchResult[] => {
  return products.map(product => ({
    ...product,
    priceStatus: product.priceStatus as ProductPriceStatus,
    reactions: product.reactions || [],
    userReactions: product.userReactions || [],
  }));
};

type UseMixedFeedReturn = {
  fitpics: FitPic[];
  products: ProductSearchResult[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => void;
  loadMore: () => void;
  handleLike: (fitpicId: string) => void;
  handleSave: (fitpicId: string) => void;
};

export function useMixedFeed(feedType: FeedType): UseMixedFeedReturn {
  const [fitpics, setFitpics] = useState<FitPic[]>([]);
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await contentApiClient.getFeed({
        type: feedType === 'forYou' ? 'forYou' : feedType === 'following' ? 'following' : undefined,
        limit: 20,
      });
      
      setFitpics(response.fitpics);
      setProducts(castProductsData(response.products));
      setHasMore(response.pagination?.hasMore ?? false);
      setCursor(response.pagination?.nextCursor);
    } catch (err) {
      setError('Failed to load content');
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  }, [feedType]);

  // Refresh data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const response = await contentApiClient.getFeed({
        type: feedType === 'forYou' ? 'forYou' : feedType === 'following' ? 'following' : undefined,
        limit: 20,
      });
      
      setFitpics(response.fitpics);
      setProducts(castProductsData(response.products));
      setHasMore(response.pagination?.hasMore ?? false);
      setCursor(response.pagination?.nextCursor);
    } catch (err) {
      setError('Failed to refresh content');
      console.error('Error refreshing feed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [feedType]);

  // Load more data (simulate pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    
    setLoading(true);
    
    try {
      const response = await contentApiClient.getFeed({
        type: feedType === 'forYou' ? 'forYou' : feedType === 'following' ? 'following' : undefined,
        limit: 20,
        cursor,
      });
      
      setFitpics(prev => [...prev, ...response.fitpics]);
      setProducts(prev => [...prev, ...castProductsData(response.products)]);
      setHasMore(response.pagination?.hasMore ?? false);
      setCursor(response.pagination?.nextCursor);
    } catch (err) {
      setError('Failed to load more content');
      console.error('Error loading more:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, feedType]);

  // Handle like action
  const handleLike = useCallback((fitpicId: string) => {
    setFitpics(prev => 
      prev.map(fitpic => {
        if (fitpic.id === fitpicId) {
          const isLiked = fitpic.engagement.isLiked;
          return {
            ...fitpic,
            engagement: {
              ...fitpic.engagement,
              isLiked: !isLiked,
              likes: isLiked ? fitpic.engagement.likes - 1 : fitpic.engagement.likes + 1,
            },
          };
        }
        return fitpic;
      })
    );
  }, []);

  // Handle save action
  const handleSave = useCallback((fitpicId: string) => {
    setFitpics(prev => 
      prev.map(fitpic => {
        if (fitpic.id === fitpicId) {
          const isSaved = fitpic.engagement.isSaved;
          return {
            ...fitpic,
            engagement: {
              ...fitpic.engagement,
              isSaved: !isSaved,
              saves: isSaved ? (fitpic.engagement.saves ?? 0) - 1 : (fitpic.engagement.saves ?? 0) + 1,
            },
          };
        }
        return fitpic;
      })
    );
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    fitpics,
    products,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    handleLike,
    handleSave,
  };
}
