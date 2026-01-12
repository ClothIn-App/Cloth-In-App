import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchUsers, type CategorySearchResponse } from '../src/services/searchApi';
import type { UserSearchResult, UserSortBy, UserSearchFilters } from '../src/types/search';
import UserListItem from '../components/search/UserListItem';
import SearchAnalytics from '../components/search/SearchAnalytics';

export default function SearchProfilesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNoConnection, setIsNoConnection] = useState(false);
  
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [searchTime, setSearchTime] = useState<number | undefined>(undefined);

  // Handle both string and array params
  const query = typeof params.q === 'string' ? params.q : (Array.isArray(params.q) ? params.q[0] : '') || '';

  // Load initial results
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

      const response: CategorySearchResponse<UserSearchResult> = await searchUsers(
        query,
        {}, // filters - TODO: Add filter support
        'relevance', // sortBy - TODO: Add sort dropdown
        cursor
      );

      if (reset) {
        setUsers(response.items);
      } else {
        setUsers(prev => [...prev, ...response.items]);
      }

      setTotalEstimate(response.totalEstimate);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setSearchTime(response.searchTime);
    } catch (err) {
      console.error('Error loading profiles:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profiles';
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

  const handleUserPress = (user: UserSearchResult) => {
    // TODO: Navigate to user profile
    console.log('Navigate to profile:', user.uid);
  };

  const handleFollowPress = (user: UserSearchResult) => {
    // TODO: Implement follow/unfollow
    setUsers(prev =>
      prev.map(u =>
        u.uid === user.uid ? { ...u, isFollowing: !u.isFollowing } : u
      )
    );
  };

  const renderUser = ({ item }: { item: UserSearchResult }) => (
    <UserListItem
      user={item}
      onPress={handleUserPress}
      onFollowPress={handleFollowPress}
    />
  );

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
        <Ionicons name="people-outline" size={64} color="#9ca3af" />
        <Text style={styles.emptyTitle}>No profiles found</Text>
        <Text style={styles.emptyMessage}>
          We couldn't find any profiles for "{query}"
        </Text>
        <Text style={styles.emptySubtext}>
          Try searching with different keywords
        </Text>
      </View>
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profiles</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#11181C" />
          <Text style={styles.loadingText}>Searching profiles...</Text>
        </View>
      </View>
    );
  }

  if (error && users.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profiles</Text>
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
          Profiles: {query}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Analytics */}
      {totalEstimate > 0 && (
        <SearchAnalytics
          totalResults={totalEstimate}
          searchTime={searchTime}
          query={query}
          category="profiles"
        />
      )}

      {/* Results List */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={users.length === 0 ? styles.emptyListContainer : undefined}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

