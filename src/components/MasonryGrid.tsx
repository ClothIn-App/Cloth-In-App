/**
 * MasonryGrid Component
 * Pinterest-style masonry layout that displays both fitpics and products
 * Uses actual image dimensions for sizing and loads in 1A>1B>2A>2B order
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FitPicCard from './FitPicCard';
import ProductCard from './ProductCard';
import type { FitPic } from '../types/fitpic';
import type { ProductSearchResult } from '../types/search';

type ContentItem = {
  id: string;
  type: 'fitpic' | 'product';
  data: FitPic | ProductSearchResult;
  width: number;
  height: number;
  top: number;
  left: number;
  loadingOrder: number;
};

type Props = {
  fitpics: FitPic[];
  products: ProductSearchResult[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onFitPicPress: (fitpic: FitPic) => void;
  onProductPress: (product: ProductSearchResult) => void;
  emptyMessage?: string;
  emptySubtitle?: string;
  style?: any;
};

const { width: screenWidth } = Dimensions.get('window');
const getNumColumns = () => {
  if (screenWidth >= 768) return 3; // Tablet
  return 2; // Phone
};

const getMaxCardWidth = () => {
  const numColumns = getNumColumns();
  const horizontalPadding = 24; // 12px padding on each side
  const cardMargins = 12; // 6px margin between cards
  const totalMarginSpace = cardMargins * (numColumns - 1);
  return (screenWidth - horizontalPadding - totalMarginSpace) / numColumns;
};

// Calculate actual card width based on image dimensions
const calculateCardDimensions = (imageWidth: number, imageHeight: number, maxWidth: number) => {
  const aspectRatio = imageWidth / imageHeight;
  const cardWidth = Math.min(imageWidth, maxWidth);
  const cardHeight = cardWidth / aspectRatio;
  
  // Add space for text content below image (40px for products, 35px for fitpics)
  const textHeight = 40; // Fixed height for text section
  
  return {
    width: cardWidth,
    height: cardHeight + textHeight,
    imageHeight: cardHeight,
  };
};

// Create masonry layout with proper column distribution
const createMasonryLayout = (items: ContentItem[], numColumns: number): { items: ContentItem[], containerHeight: number } => {
  const columnHeights: number[] = Array(numColumns).fill(0);
  const columnLeftPositions: number[] = [];
  const cardMargin = 12; // 6px margin on each side
  const containerPadding = 12; // 12px padding from screen edge
  
  // Calculate left positions for each column
  for (let i = 0; i < numColumns; i++) {
    const leftPosition = containerPadding + i * (getMaxCardWidth() + cardMargin);
    columnLeftPositions.push(leftPosition);
  }
  
  // Sort items by loading order (1A>1B>2A>2B)
  const sortedItems = [...items].sort((a, b) => a.loadingOrder - b.loadingOrder);
  
  const positionedItems = sortedItems.map((item) => {
    // Find the column with the smallest height
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    
    // Calculate position
    const top = columnHeights[shortestColumnIndex];
    const left = columnLeftPositions[shortestColumnIndex];
    
    // Update column height
    columnHeights[shortestColumnIndex] += item.height + cardMargin;
    
    return {
      ...item,
      top,
      left,
    };
  });
  
  // Calculate container height (maximum column height)
  const containerHeight = Math.max(...columnHeights);
  
  return {
    items: positionedItems,
    containerHeight,
  };
};

export default function MasonryGrid({
  fitpics,
  products,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  onFitPicPress,
  onProductPress,
  emptyMessage = 'No content yet',
  emptySubtitle = 'Discover amazing styles and products!',
  style,
}: Props) {
  const numColumns = getNumColumns();
  const maxCardWidth = getMaxCardWidth();
  
  // Mix and create content items with proper dimensions
  const mixedContent = useMemo(() => {
    const items: ContentItem[] = [];
    let loadingOrder = 0;
    
    // Convert fitpics to content items with actual image dimensions
    fitpics.forEach((fitpic) => {
      const coverPhoto = fitpic.photos.find(photo => photo.isCover) || fitpic.photos[0];
      
      // Use actual image dimensions or default to 800x1000
      const imageWidth = coverPhoto?.width || 800;
      const imageHeight = coverPhoto?.height || 1000;
      
      const dimensions = calculateCardDimensions(imageWidth, imageHeight, maxCardWidth);
      
      items.push({
        id: `fitpic_${fitpic.id}`,
        type: 'fitpic',
        data: fitpic,
        width: dimensions.width,
        height: dimensions.height,
        top: 0, // Will be set by masonry algorithm
        left: 0, // Will be set by masonry algorithm
        loadingOrder: loadingOrder++,
      });
    });
    
    // Convert products to content items with actual image dimensions
    products.forEach((product) => {
      // For products, we'll use a more square aspect ratio as default
      // since we don't have actual dimensions in the mock data
      const imageWidth = 400; // Default product image width
      const imageHeight = 400; // Default product image height
      
      const dimensions = calculateCardDimensions(imageWidth, imageHeight, maxCardWidth);
      
      items.push({
        id: `product_${product.id}`,
        type: 'product',
        data: product,
        width: dimensions.width,
        height: dimensions.height,
        top: 0, // Will be set by masonry algorithm
        left: 0, // Will be set by masonry algorithm
        loadingOrder: loadingOrder++,
      });
    });
    
    // Shuffle the array to randomize distribution while maintaining loading order
    return items.sort(() => Math.random() - 0.5).map((item, index) => ({
      ...item,
      loadingOrder: index, // Reassign loading order after shuffle
    }));
  }, [fitpics, products, maxCardWidth]);

  // Create masonry layout with absolute positioning
  const masonryLayout = useMemo(() => {
    return createMasonryLayout(mixedContent, numColumns);
  }, [mixedContent, numColumns]);

  const renderItem = (item: ContentItem) => {
    const itemStyle = {
      position: 'absolute' as const,
      top: item.top,
      left: item.left,
      width: item.width,
      height: item.height,
    };

    if (item.type === 'fitpic') {
      return (
        <FitPicCard
          key={item.id}
          fitpic={item.data as FitPic}
          onPress={onFitPicPress}
          style={itemStyle}
          width={item.width}
        />
      );
    } else {
      return (
        <ProductCard
          key={item.id}
          product={item.data as ProductSearchResult}
          onPress={onProductPress}
          style={itemStyle}
          width={item.width}
        />
      );
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={48} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || mixedContent.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6b7280" />
      </View>
    );
  };

  const renderHeader = () => {
    if (loading && mixedContent.length === 0) {
      return (
        <View style={styles.headerLoader}>
          <ActivityIndicator size="large" color="#6b7280" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      );
    }
    return null;
  };

  if (mixedContent.length === 0 && !loading) {
    return (
      <View style={[styles.container, style]}>
        {renderEmpty()}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
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
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            onLoadMore?.();
          }
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        <View style={[styles.masonryContainer, { height: masonryLayout.containerHeight }]}>
          {masonryLayout.items.map((item) => renderItem(item))}
        </View>
        {renderFooter()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  masonryContainer: {
    position: 'relative',
    paddingTop: 8,
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
    marginTop: 16,
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
});
