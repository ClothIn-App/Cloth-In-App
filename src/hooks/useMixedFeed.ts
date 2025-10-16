/**
 * useMixedFeed Hook
 * Manages both fitpics and products data for the home feed
 * Provides unified loading states and data management
 */

import { useState, useEffect, useCallback } from 'react';
import type { FitPic } from '../types/fitpic';
import type { ProductSearchResult, ProductPriceStatus } from '../types/search';
import fitpicsData from '../mocks/fitpics.json';
import productsData from '../mocks/products.json';

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

  // Simulate API delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await delay(800); // Simulate network delay
      
      // Load fitpics
      const fitpicsResponse = fitpicsData.fitpics;
      setFitpics(fitpicsResponse);
      
      // Load products - take a subset for variety
      const productsResponse = castProductsData(productsData.products.slice(0, 15));
      setProducts(productsResponse);
      
      setHasMore(true);
    } catch (err) {
      setError('Failed to load content');
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await delay(500);
      
      // Reload data
      const fitpicsResponse = fitpicsData.fitpics;
      const productsResponse = castProductsData(productsData.products.slice(0, 15));
      
      setFitpics(fitpicsResponse);
      setProducts(productsResponse);
      setHasMore(true);
    } catch (err) {
      setError('Failed to refresh content');
      console.error('Error refreshing feed:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load more data (simulate pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    try {
      await delay(600);
      
      // Simulate loading more products
      const currentProductCount = products.length;
      const remainingProducts = castProductsData(productsData.products.slice(currentProductCount, currentProductCount + 10));
      
      if (remainingProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => [...prev, ...remainingProducts]);
      }
    } catch (err) {
      setError('Failed to load more content');
      console.error('Error loading more:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, products.length]);

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
              saves: isSaved ? fitpic.engagement.saves - 1 : fitpic.engagement.saves + 1,
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
