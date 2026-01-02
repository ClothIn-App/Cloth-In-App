import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { FitPicSearchResult } from '../../src/types/search';

type Props = {
  fitpics: FitPicSearchResult[];
  onSeeAll: () => void;
};

export default function FitPicsPreview({ fitpics, onSeeAll }: Props) {
  const previewFitpics = fitpics.slice(0, 6); // 2x3 grid

  const renderThumbnail = ({ item }: { item: FitPicSearchResult }) => {
    const coverPhoto = item.photos.find(p => p.isCover) || item.photos[0];
    const thumbnailUrl = coverPhoto?.thumbnailUrl || coverPhoto?.url;

    const handlePress = () => {
      router.push({
        pathname: '/fitpic-detail',
        params: { id: item.id },
      });
    };

    return (
      <TouchableOpacity 
        style={styles.thumbnailContainer}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: thumbnailUrl || 'https://placehold.co/150x150' }}
          style={styles.thumbnail}
        />
        <View style={styles.overlay}>
          <View style={styles.engagementRow}>
            <Ionicons name="heart" size={14} color="#FFFFFF" />
            <Text style={styles.engagementText}>{item.engagement.likes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>FitPics</Text>
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>
            {fitpics.length > previewFitpics.length ? 'See all' : 'Expand'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#666A70" />
        </TouchableOpacity>
      </View>

      {previewFitpics.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No FitPics found</Text>
        </View>
      ) : (
        <FlatList
          data={previewFitpics}
          renderItem={renderThumbnail}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#666A70',
    fontWeight: '500',
  },
  grid: {
    gap: 2,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  thumbnailContainer: {
    width: '32%',
    aspectRatio: 1,
    position: 'relative',
  },
  thumbnail: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  engagementText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666A70',
  },
});

