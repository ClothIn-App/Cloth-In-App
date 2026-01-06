import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchTop, type SearchTopResponse } from '../src/services/searchApi';
import type { SearchResult } from '../src/types/search';
import ProfilesPreview from '../components/search/ProfilesPreview';
import FitPicsPreview from '../components/search/FitPicsPreview';
import ProductsPreview from '../components/search/ProductsPreview';

export default function SearchResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNoConnection, setIsNoConnection] = useState(false);
  const [searchData, setSearchData] = useState<SearchTopResponse | null>(null);

  // Handle both string and array params (Expo Router can return arrays)
  const query = typeof params.q === 'string' ? params.q : (Array.isArray(params.q) ? params.q[0] : '') || '';

  useEffect(() => {
    // Debug: Log the query to verify it's being received
    console.log('SearchResults: Received query param:', params.q, 'Processed query:', query);
    
    if (!query.trim()) {
      setLoading(false);
      setError('No search query provided');
      return;
    }

    loadSearchResults();
  }, [query]);

  const loadSearchResults = async () => {
    setLoading(true);
    setError(null);
    setIsNoConnection(false);

    try {
      console.log('SearchResults: Calling searchTop with query:', query);
      const results = await searchTop(query);
      console.log('SearchResults: Received results:', {
        users: results.results.users.length,
        fitpics: results.results.fitpics.length,
        products: results.results.products.length,
        totalEstimate: results.totalEstimate,
      });
      setSearchData(results);
    } catch (err) {
      console.error('SearchResults: Error loading results:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load search results';
      setError(errorMessage);
      // Check if it's a connection error
      setIsNoConnection(errorMessage.toLowerCase().includes('connection') || errorMessage.toLowerCase().includes('internet'));
    } finally {
      setLoading(false);
    }
  };

  const handleSeeAll = (section: 'profiles' | 'fitpics' | 'products') => {
    // Placeholder for future "See all" pages
    console.log(`See all ${section} for query: ${query}`);
  };

  if (loading) {
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

  if (error) {
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
          <TouchableOpacity style={styles.retryButton} onPress={loadSearchResults}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!searchData || searchData.totalEstimate === 0) {
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

  const { results } = searchData;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {query}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profiles Preview Section - Always render */}
        <ProfilesPreview
          users={results.users}
          onSeeAll={() => handleSeeAll('profiles')}
        />

        {/* FitPics Preview Section - Always render */}
        <FitPicsPreview
          fitpics={results.fitpics}
          onSeeAll={() => handleSeeAll('fitpics')}
        />

        {/* Products Preview Section - Always render */}
        <ProductsPreview
          products={results.products}
          onSeeAll={() => handleSeeAll('products')}
        />
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

