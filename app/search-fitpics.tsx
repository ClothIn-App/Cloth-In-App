import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchFitPics, type CategorySearchResponse } from '../src/services/searchApi';
import type { FitPicSearchResult, FitPicSortBy, FitPicSearchFilters } from '../src/types/search';
import SearchAnalytics from '../components/search/SearchAnalytics';

export default function SearchFitPicsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNoConnection, setIsNoConnection] = useState(false);
  
  const [fitpics, setFitpics] = useState<FitPicSearchResult[]>([]);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTime, setSearchTime] = useState<number | undefined>(undefined);

  const query = typeof params.q === 'string' ? params.q : (Array.isArray(params.q) ? params.q[0] : '') || '';

  useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      setError('No search query provided');
      return;
    }
    loadResults(true);
  }, [query]);

  const loadResults = async (reset: boolean = false, cursor: string | null = null) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
        setIsNoConnection(false);
      } else {
        setLoadingMore(true);
      }

      const response: CategorySearchResponse<FitPicSearchResult> = await searchFitPics(
        query,
        {}, // filters - TODO: Add filter support
        'relevance', // sortBy - TODO: Add sort dropdown
        cursor
      );

      if (reset) {
        setFitpics(response.items);
      } else {
        setFitpics(prev => [...prev, ...response.items]);
      }

      setTotalEstimate(response.totalEstimate);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setSearchTime(response.searchTime);
    } catch (err) {
      console.error('Error loading fitpics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load fitpics';
      setError(errorMessage);
      setIsNoConnection(errorMessage.toLowerCase().includes('connection') || errorMessage.toLowerCase().includes('internet'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && nextCursor) {
      loadResults(false, nextCursor);
    }
  }, [loadingMore, hasMore, nextCursor, query]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadResults(true);
  }, [query]);

  const handleFitPicPress = (fitpic: FitPicSearchResult) => {
    router.push({
      pathname: '/fitpic-detail',
      params: { id: fitpic.id },
    });
  };

  const renderFitPic = ({ item }: { item: FitPicSearchResult }) => {
    const coverPhoto = item.photos.find(p => p.isCover) || item.photos[0];
    const thumbnailUrl = coverPhoto?.thumbnailUrl || coverPhoto?.url;

    return (
      <TouchableOpacity
        style={styles.fitpicContainer}
        onPress={() => handleFitPicPress(item)}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: thumbnailUrl || 'https://placehold.co/300x300' }}
          style={styles.fitpicImage}
        />
        <View style={styles.overlay}>
          <View style={styles.engagementRow}>
            <Ionicons name="heart" size={14} color="#FFFFFF" />
            <Text style={styles.engagementText}>{item.engagement.likes}</Text>
            <Ionicons name="chatbubble" size={14} color="#FFFFFF" style={styles.engagementIcon} />
            <Text style={styles.engagementText}>{item.engagement.comments}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#11181C" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No FitPics found</Text>
        <Text style={styles.emptyMessage}>
          We couldn't find any FitPics for "{query}"
        </Text>
        <Text style={styles.emptySubtext}>
          Try searching with different keywords
        </Text>
      </View>
    );
  };

  if (loading && fitpics.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FitPics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#11181C" />
          <Text style={styles.loadingText}>Searching FitPics...</Text>
        </View>
      </View>
    );
  }

  if (error && fitpics.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FitPics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons 
            name={isNoConnection ? "cloud-offline-outline" : "alert-circle-outline"} 
            size={48} 
            color="#ef4444" 
          />
          <Text style={styles.errorTitle}>
            {isNoConnection ? 'No Connection' : 'Error'}
          </Text>
          <Text style={styles.errorMessage}>
            {isNoConnection 
              ? 'Please check your internet connection and try again.'
              : error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadResults(true)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          FitPics: {query}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Analytics */}
      {totalEstimate > 0 && (
        <SearchAnalytics
          totalResults={totalEstimate}
          searchTime={searchTime}
          query={query}
          category="fitpics"
        />
      )}

      {/* Results Grid */}
      <FlatList
        data={fitpics}
        renderItem={renderFitPic}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={fitpics.length === 0 ? styles.emptyListContainer : styles.gridContainer}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#11181C"
            colors={['#11181C']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666A70',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#11181C',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666A70',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#11181C',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#11181C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666A70',
    textAlign: 'center',
  },
  gridContainer: {
    padding: 2,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fitpicContainer: {
    width: '32%',
    aspectRatio: 1,
    position: 'relative',
    marginBottom: 2,
  },
  fitpicImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  overlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  engagementIcon: {
    marginLeft: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
});

