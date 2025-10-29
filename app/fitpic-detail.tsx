import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getFitPicById } from '../src/utils/getFeedItem';
import type { FitPicItem } from '../src/types/feed';
import PinchZoomImage from '../components/detail/PinchZoomImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FitPicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [fitpic, setFitpic] = useState<FitPicItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      getFitPicById(id).then((item) => {
        setFitpic(item);
        setLoading(false);
      });
    }
  }, [id]);

  const handleShare = async () => {
    if (!fitpic) return;
    
    try {
      await Share.share({
        message: `Check out this fit: ${fitpic.title}\n${fitpic.description}`,
        title: fitpic.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  if (!fitpic) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>FitPic not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // For now, we'll use a single image. In a real app, you'd have multiple images in a carousel
  const images = [fitpic.source]; // This would be fitpic.photos in a real implementation

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          {images.map((imageSource, index) => (
            <View
              key={index}
              style={[
                styles.imageWrapper,
                { display: index === currentImageIndex ? 'flex' : 'none' },
              ]}
            >
              <PinchZoomImage
                source={imageSource}
                style={styles.image}
              />
            </View>
          ))}
          
          {/* Image indicator dots */}
          {images.length > 1 && (
            <View style={styles.indicatorContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Creator Card */}
          <View style={styles.creatorCard}>
            <View style={styles.creatorInfo}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#666" />
              </View>
              <View style={styles.creatorText}>
                <Text style={styles.creatorName}>@{fitpic.author}</Text>
                <Text style={styles.creatorMeta}>{fitpic.likes} likes</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <View style={styles.captionSection}>
            <Text style={styles.captionAuthor}>@{fitpic.author}</Text>
            <Text style={styles.captionText}>{fitpic.description}</Text>
          </View>

          {/* Tags / Featured Products */}
          {fitpic.featuredProducts && fitpic.featuredProducts.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <View style={styles.tagsContainer}>
                {fitpic.featuredProducts.map((productId) => (
                  <TouchableOpacity
                    key={productId}
                    style={styles.tag}
                    onPress={() => {
                      router.push({
                        pathname: '/product-detail',
                        params: { id: productId },
                      });
                    }}
                  >
                    <Ionicons name="pricetag" size={14} color="#666" />
                    <Text style={styles.tagText}>{productId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Engagement Stats */}
          <View style={styles.engagementSection}>
            <TouchableOpacity style={styles.engagementButton}>
              <Ionicons name="heart-outline" size={24} color="#000" />
              <Text style={styles.engagementText}>{fitpic.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.engagementButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#000" />
              <Text style={styles.engagementText}>Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.engagementButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    padding: 12,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  content: {
    padding: 16,
  },
  creatorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorText: {
    gap: 2,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  creatorMeta: {
    fontSize: 14,
    color: '#666',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  captionSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  captionAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  captionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  tagsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  engagementSection: {
    flexDirection: 'row',
    paddingVertical: 16,
    gap: 8,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  engagementText: {
    fontSize: 14,
    color: '#000',
  },
});

