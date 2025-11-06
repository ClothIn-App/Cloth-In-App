import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFitPicById } from '../src/utils/getFeedItem';
import type { FitPicItem } from '../src/types/feed';
import FitPicModalUser from '../components/fitpic-modal/fitpic-modal-user';
import FitPicModalMedia from '../components/fitpic-modal/fitpic-modal-media';

export default function FitPicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fitpic, setFitpic] = useState<FitPicItem | null>(null);

  useEffect(() => {
    if (id) {
      getFitPicById(id).then((item) => {
        setFitpic(item);
      });
    }
  }, [id]);

  // Calculate aspect ratio from fitpic dimensions if available
  const aspectRatio = fitpic?.width && fitpic?.height
    ? fitpic.height / fitpic.width
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
});

