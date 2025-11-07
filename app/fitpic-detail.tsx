import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFitPicById } from '../src/utils/getFeedItem';
import type { FitPicItem, Reactions } from '../src/types/feed';
import FitPicModalUser from '../components/fitpic-modal/fitpic-modal-user';
import FitPicModalMedia from '../components/fitpic-modal/fitpic-modal-media';
import FitPicModalCaption from '../components/fitpic-modal/fitpic-modal-caption';
import MockFitPicReactionBar from '../components/fitpic-modal/mock-fitpic-reactionbar';

export default function FitPicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fitpic, setFitpic] = useState<FitPicItem | null>(null);
  const [reactions, setReactions] = useState<Reactions | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFitPic = useCallback(async () => {
    if (!id) return;
    
    const item = await getFitPicById(id);
    if (item) {
      setFitpic(item);
      setReactions(item.reactions);
    }
  }, [id]);

  useEffect(() => {
    loadFitPic();
  }, [loadFitPic]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFitPic();
    } finally {
      setRefreshing(false);
    }
  }, [loadFitPic]);

  // Calculate aspect ratio from fitpic dimensions if available
  const aspectRatio = fitpic?.width && fitpic?.height
    ? fitpic.height / fitpic.width
    : undefined;

  // Extract username from author (FitPicItem.author is always a string)
  const username = fitpic?.author;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header - Fixed */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
            colors={['#000']}
          />
        }
      >
        {/* User Information */}
        {fitpic && <FitPicModalUser author={fitpic.author} />}

        {/* Media */}
        {fitpic && (
          <FitPicModalMedia
            imageUrl={fitpic.source}
            aspectRatio={aspectRatio}
            borderRadius={0}
          />
        )}

        {/* ReactionBar */}
        {fitpic && reactions && (
          <MockFitPicReactionBar
            reactions={reactions}
            onChange={(newReactions) => {
              setReactions(newReactions);
              // In a real app, you would also call an API to persist the reaction
            }}
          />
        )}

        {/* Caption */}
        {fitpic && (
          <FitPicModalCaption
            caption={fitpic.caption}
            username={username}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  backButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});

