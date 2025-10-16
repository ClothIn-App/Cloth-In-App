/**
 * FeaturedFitPics Component
 * Displays fitpics that feature the current product in a scrollable grid
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FitPic } from '../types/fitpic';

type Props = {
  fitpics: FitPic[];
  onFitPicPress?: (fitpic: FitPic) => void;
  style?: any;
};

const { width: screenWidth } = Dimensions.get('window');
const itemSize = (screenWidth - 48) / 3; // 3 columns with padding

export default function FeaturedFitPics({ fitpics, onFitPicPress, style }: Props) {
  const handleCreateFitPic = () => {
    // Navigate to create fitpic screen
    // This would typically use navigation, but for now we'll just log
    console.log('Navigate to create fitpic');
    // In a real app, this would be: navigation.navigate('create-fitpic')
  };

  const renderFitPicItem = ({ item }: { item: FitPic }) => (
    <TouchableOpacity
      style={styles.fitpicItem}
      onPress={() => onFitPicPress?.(item)}
      accessibilityLabel={`View fitpic by ${item.author.username}`}
    >
      <Image
        source={{ uri: item.photos[0]?.url }}
        style={styles.fitpicImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No fitpics yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to feature this product in a fitpic!
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateFitPic}>
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create FitPic</Text>
      </TouchableOpacity>
    </View>
  );

  if (fitpics.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.sectionTitle}>Featured In</Text>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Featured In</Text>
      <View style={styles.gridContainer}>
        {fitpics.map((fitpic, index) => (
          <View key={fitpic.id} style={[styles.gridItem, index % 3 === 0 && styles.firstInRow]}>
            {renderFitPicItem({ item: fitpic })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  gridItem: {
    width: itemSize,
    marginBottom: 8,
  },
  firstInRow: {
    marginLeft: 0,
  },
  fitpicItem: {
    width: itemSize,
    height: itemSize,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  fitpicImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11181C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
