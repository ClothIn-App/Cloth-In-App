import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  searchTop, 
  searchUsers, 
  searchFitPics, 
  searchProducts, 
  searchHashtags,
  type SearchTopResponse,
  type CategorySearchResponse,
} from '../src/services/searchApi';
import type { 
  SearchResult,
  UserSearchResult,
  FitPicSearchResult,
  ProductSearchResult,
  HashtagSearchResult,
} from '../src/types/search';
import SearchTabs, { type SearchTabKey } from '../components/search/SearchTabs';
import SearchAnalytics from '../components/search/SearchAnalytics';
import ProfilesPreview from '../components/search/ProfilesPreview';
import FitPicsPreview from '../components/search/FitPicsPreview';
import ProductsPreview from '../components/search/ProductsPreview';
import HashtagsPreview from '../components/search/HashtagsPreview';

type CategoryResults = 
  | CategorySearchResponse<UserSearchResult>
  | CategorySearchResponse<FitPicSearchResult>
  | CategorySearchResponse<ProductSearchResult>
  | CategorySearchResponse<HashtagSearchResult>;

export default function SearchResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const [activeTab, setActiveTab] = useState<SearchTabKey>('top');
  
  // Request tracking refs to prevent race conditions
  const activeRequestRef = useRef<{ category: SearchTabKey; requestId: number } | null>(null);
  const requestIdCounter = useRef(0);
  
  // Top results state
  const [topResults, setTopResults] = useState<SearchTopResponse | null>(null);
  const [loadingTop, setLoadingTop] = useState(true);
  
  // Category-specific states
  const [categoryResults, setCategoryResults] = useState<CategoryResults | null>(null);
  const [loadingCategory, setLoadingCategory] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [isNoConnection, setIsNoConnection] = useState(false);

  // Handle both string and array params (Expo Router can return arrays)
  const query = typeof params.q === 'string' ? params.q : (Array.isArray(params.q) ? params.q[0] : '') || '';
  const initialCategory = params.category as SearchTabKey | undefined;

  // Initialize with category from params if provided
  useEffect(() => {
    if (initialCategory && ['top', 'profiles', 'fitpics', 'products', 'hashtags'].includes(initialCategory)) {
      setActiveTab(initialCategory as SearchTabKey);
    }
  }, [initialCategory]);

  // Load top results on mount
  useEffect(() => {
    if (!query.trim()) {
      setLoadingTop(false);
      setError('No search query provided');
      return;
    }

    loadTopResults();
  }, [query]);

  // Load category-specific results when tab changes
  useEffect(() => {
    if (activeTab !== 'top' && query.trim()) {
      loadCategoryResults(activeTab);
    }
  }, [activeTab, query]);

  const loadTopResults = async () => {
    setLoadingTop(true);
    setError(null);
    setIsNoConnection(false);

    try {
      const results = await searchTop(query);
      setTopResults(results);
    } catch (err) {
      console.error('SearchResults: Error loading top results:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load search results';
      setError(errorMessage);
      setIsNoConnection(errorMessage.toLowerCase().includes('connection') || errorMessage.toLowerCase().includes('internet'));
    } finally {
      setLoadingTop(false);
    }
  };

  const loadCategoryResults = async (category: SearchTabKey) => {
    // Generate unique request ID for this request
    const requestId = ++requestIdCounter.current;
    activeRequestRef.current = { category, requestId };
    
    setLoadingCategory(true);
    setError(null);
    setIsNoConnection(false);

    try {
      let results: CategoryResults;
      
      switch (category) {
        case 'profiles':
          results = await searchUsers(query, {}, 'relevance', null);
          break;
        case 'fitpics':
          results = await searchFitPics(query, {}, 'relevance', null);
          break;
        case 'products':
          results = await searchProducts(query, {}, 'relevance', null);
          break;
        case 'hashtags':
          results = await searchHashtags(query, {}, 'relevance', null);
          break;
        default:
          return;
      }
      
      // Only update state if this is still the active request
      if (activeRequestRef.current?.requestId === requestId && activeRequestRef.current?.category === category) {
        // Validate and filter results before setting state
        const validatedResults = validateCategoryResults(results, category);
        setCategoryResults(validatedResults);
      }
    } catch (err) {
      // Only update error state if this is still the active request
      if (activeRequestRef.current?.requestId === requestId && activeRequestRef.current?.category === category) {
        console.error(`SearchResults: Error loading ${category} results:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load search results';
        setError(errorMessage);
        setIsNoConnection(errorMessage.toLowerCase().includes('connection') || errorMessage.toLowerCase().includes('internet'));
      }
    } finally {
      // Only update loading state if this is still the active request
      if (activeRequestRef.current?.requestId === requestId && activeRequestRef.current?.category === category) {
        setLoadingCategory(false);
      }
    }
  };

  // Validate category results before setting state
  const validateCategoryResults = (results: CategoryResults, category: SearchTabKey): CategoryResults => {
    if (!results || !results.items) {
      return results;
    }

    // Filter out invalid items based on category
    const validItems = results.items.filter((item: any) => {
      switch (category) {
        case 'fitpics':
          // Ensure fitpic has required properties
          return item && 
                 item.id && 
                 Array.isArray(item.photos) && 
                 item.engagement && 
                 typeof item.engagement.likes === 'number';
        case 'profiles':
          return item && item.id && item.uid && item.username;
        case 'products':
          return item && item.id && item.name;
        case 'hashtags':
          return item && item.tag && typeof item.postCount === 'number';
        default:
          return true;
      }
    });

    return {
      ...results,
      items: validItems,
      totalEstimate: validItems.length,
    };
  };

  const handleTabChange = (tab: SearchTabKey) => {
    // Cancel any pending requests by clearing the active request ref
    activeRequestRef.current = null;
    setActiveTab(tab);
    setCategoryResults(null); // Clear previous category results
  };

  const handleSeeAll = (section: 'profiles' | 'fitpics' | 'products' | 'hashtags') => {
    // Navigate to category-specific "See All" page
    router.push({
      pathname: `/search-${section}`,
      params: { q: query },
    });
  };

  const handleRefresh = useCallback(() => {
    if (activeTab === 'top') {
      loadTopResults();
    } else {
      loadCategoryResults(activeTab);
    }
  }, [activeTab, query]);

  // Tab definitions with counts
  const getTabs = () => {
    const tabs = [
      { key: 'top' as SearchTabKey, label: 'Top', count: topResults?.totalEstimate },
      { key: 'profiles' as SearchTabKey, label: 'Profiles', count: topResults?.results.users.length },
      { key: 'fitpics' as SearchTabKey, label: 'FitPics', count: topResults?.results.fitpics.length },
      { key: 'products' as SearchTabKey, label: 'Products', count: topResults?.results.products.length },
      { key: 'hashtags' as SearchTabKey, label: 'Hashtags', count: topResults?.results.hashtags.length },
    ];

    // Update count for active category tab if we have category results
    if (categoryResults && activeTab !== 'top') {
      const tabIndex = tabs.findIndex(t => t.key === activeTab);
      if (tabIndex !== -1) {
        tabs[tabIndex].count = categoryResults.totalEstimate;
      }
    }

    return tabs;
  };

  // Render category-specific content
  const renderCategoryContent = () => {
    if (!categoryResults || !categoryResults.items) return null;

    // Additional validation before rendering
    const items = categoryResults.items;
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    switch (activeTab) {
      case 'profiles':
        return (
          <ProfilesPreview
            users={(categoryResults as CategorySearchResponse<UserSearchResult>).items}
            onSeeAll={() => handleSeeAll('profiles')}
          />
        );
      
      case 'fitpics':
        // Filter out invalid fitpics before rendering
        const validFitpics = (categoryResults as CategorySearchResponse<FitPicSearchResult>).items.filter(
          (fitpic) => fitpic && Array.isArray(fitpic.photos) && fitpic.engagement
        );
        return (
          <FitPicsPreview
            fitpics={validFitpics}
            onSeeAll={() => handleSeeAll('fitpics')}
          />
        );
      
      case 'products':
        return (
          <ProductsPreview
            products={(categoryResults as CategorySearchResponse<ProductSearchResult>).items}
            onSeeAll={() => handleSeeAll('products')}
          />
        );
      
      case 'hashtags':
        return (
          <HashtagsPreview
            hashtags={(categoryResults as CategorySearchResponse<HashtagSearchResult>).items}
            onSeeAll={() => handleSeeAll('hashtags')}
          />
        );
      
      default:
        return null;
    }
  };

  // Loading state
  if (loadingTop && !topResults) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Results</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#11181C" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !topResults) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {query || 'Search Results'}
          </Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={loadTopResults}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state (no results)
  if (topResults && topResults.totalEstimate === 0 && activeTab === 'top') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Results</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyMessage}>
            We couldn't find anything for "{query}"
          </Text>
          <Text style={styles.emptySubtext}>
            Try searching with different keywords
          </Text>
        </View>
      </View>
    );
  }

  const tabs = getTabs();
  const isTopTab = activeTab === 'top';
  const isLoading = isTopTab ? loadingTop : loadingCategory;
  const hasResults = isTopTab 
    ? topResults && topResults.totalEstimate > 0
    : categoryResults && categoryResults.totalEstimate > 0;
  
  const analytics = isTopTab && topResults
    ? { totalResults: topResults.totalEstimate, searchTime: topResults.searchTime, query }
    : categoryResults
    ? { totalResults: categoryResults.totalEstimate, searchTime: categoryResults.searchTime, query }
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {query}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <SearchTabs
        tabs={tabs}
        activeKey={activeTab}
        onChange={handleTabChange}
      />

      {/* Search Analytics */}
      {analytics && hasResults && (
        <SearchAnalytics
          totalResults={analytics.totalResults}
          searchTime={analytics.searchTime}
          query={analytics.query}
        />
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#11181C"
            colors={['#11181C']}
          />
        }
      >
        {isLoading && !hasResults ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#11181C" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : isTopTab && topResults ? (
          <>
            {/* Top Results - Show all categories */}
            <ProfilesPreview
              users={topResults.results.users || []}
              onSeeAll={() => handleSeeAll('profiles')}
            />
            <FitPicsPreview
              fitpics={(topResults.results.fitpics || []).filter(
                (fitpic) => fitpic && Array.isArray(fitpic.photos) && fitpic.engagement
              )}
              onSeeAll={() => handleSeeAll('fitpics')}
            />
            <ProductsPreview
              products={topResults.results.products || []}
              onSeeAll={() => handleSeeAll('products')}
            />
            <HashtagsPreview
              hashtags={topResults.results.hashtags || []}
              onSeeAll={() => handleSeeAll('hashtags')}
            />
          </>
        ) : categoryResults && categoryResults.totalEstimate > 0 ? (
          renderCategoryContent()
        ) : categoryResults && categoryResults.totalEstimate === 0 ? (
          <View style={styles.emptyCategoryContainer}>
            <Ionicons name="search-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No {activeTab} found</Text>
            <Text style={styles.emptyMessage}>
              Try a different search or check other tabs
            </Text>
          </View>
        ) : null}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingContent: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyCategoryContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
});
