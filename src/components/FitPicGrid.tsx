/**
 * FitPicGrid Component
 * Displays FitPics in a responsive grid layout
 * Handles loading states and empty states
 */

import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
// FitPicCard removed - using simple placeholder
import type { FitPic } from '../types/fitpic';

type Props = {
  fitpics: FitPic[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onFitPicPress: (fitpic: FitPic) => void;
  emptyMessage?: string;
  emptySubtitle?: string;
  style?: any;
};

const { width: screenWidth } = Dimensions.get('window');
const getNumColumns = () => {
  if (screenWidth >= 768) return 3; // Tablet
  return 2; // Phone
};

export default function FitPicGrid({
  fitpics,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  onFitPicPress,
  emptyMessage = 'No fit pics yet',
  emptySubtitle = 'Be the first to share your style!',
  style,
}: Props) {
  const numColumns = getNumColumns();
  
  // Transform data into rows for proper row-first rendering
  const dataInRows = React.useMemo(() => {
    const rows: FitPic[][] = [];
    for (let i = 0; i < fitpics.length; i += numColumns) {
      rows.push(fitpics.slice(i, i + numColumns));
    }
    return rows;
  }, [fitpics, numColumns]);
  
  const renderRow = ({ item: row }: { item: FitPic[] }) => {
    return (
      <View style={styles.row}>
        {row.map((fitpic, index) => (
          <View key={fitpic.id} style={styles.column}>
            {/* Simple placeholder for deleted FitPicCard */}
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderText}>FitPic Card</Text>
            </View>
          </View>
        ))}
        {/* Fill empty columns if the last row is incomplete */}
        {row.length < numColumns && 
          Array.from({ length: numColumns - row.length }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.column} />
          ))
        }
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || fitpics.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    );
  };

  const renderHeader = () => {
    if (loading && fitpics.length === 0) {
      return (
        <View style={styles.headerLoader}>
          <ActivityIndicator size="large" color="#6b7280" />
          <Text style={styles.loadingText}>Loading fit pics...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={dataInRows}
        renderItem={renderRow}
        keyExtractor={(item, index) => `row-${index}`}
        contentContainerStyle={[
          styles.contentContainer,
          fitpics.length === 0 && !loading && styles.emptyContentContainer
        ]}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6b7280']}
              tintColor="#6b7280"
            />
          ) : undefined
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  placeholderCard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
