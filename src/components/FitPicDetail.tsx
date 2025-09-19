/**
 * FitPicDetail Component
 * Full-screen detail view for a FitPic
 * Shows all photos, products, caption, and engagement
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FitPic } from '../types/fitpic';

type Props = {
  fitpic: FitPic;
  onClose: () => void;
  onLike?: (fitpic: FitPic) => void;
  onSave?: (fitpic: FitPic) => void;
  onProductPress?: (product: any) => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FitPicDetail({
  fitpic,
  onClose,
  onLike,
  onSave,
  onProductPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(fitpic.engagement.isLiked || false);
  const [isSaved, setIsSaved] = useState(fitpic.engagement.isSaved || false);
  const [likeCount, setLikeCount] = useState(fitpic.engagement.likes);
  const [saveCount, setSaveCount] = useState(fitpic.engagement.saves);

  const currentPhoto = fitpic.photos[currentPhotoIndex];

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike?.(fitpic);
  };

  const handleSave = () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    setSaveCount(prev => newSaved ? prev + 1 : prev - 1);
    onSave?.(fitpic);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this fit pic: ${fitpic.caption}`,
        url: currentPhoto?.url,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report FitPic',
      'Are you sure you want to report this fit pic?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => {
          // Handle report
          Alert.alert('Reported', 'Thank you for your feedback.');
        }},
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#000" />
        </Pressable>
        
        <View style={styles.headerActions}>
          <Pressable onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#000" />
          </Pressable>
          <Pressable onPress={handleReport} style={styles.headerButton}>
            <Ionicons name="flag-outline" size={24} color="#000" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Author Info */}
        <View style={styles.authorSection}>
          <Image
            source={{ uri: fitpic.author.avatarUrl || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.username}>@{fitpic.author.username}</Text>
            <Text style={styles.displayName}>{fitpic.author.displayName}</Text>
          </View>
          <Text style={styles.date}>{formatDate(fitpic.createdAt)}</Text>
        </View>

        {/* Photo Carousel */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: currentPhoto?.url }}
            style={styles.photo}
            resizeMode="cover"
          />
          
          {/* Photo indicators */}
          {fitpic.photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {fitpic.photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentPhotoIndex && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          )}

          {/* Photo navigation */}
          {fitpic.photos.length > 1 && (
            <>
              {currentPhotoIndex > 0 && (
                <Pressable
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={() => setCurrentPhotoIndex(prev => prev - 1)}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </Pressable>
              )}
              {currentPhotoIndex < fitpic.photos.length - 1 && (
                <Pressable
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={() => setCurrentPhotoIndex(prev => prev + 1)}
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Engagement Actions */}
        <View style={styles.engagementSection}>
          <View style={styles.engagementActions}>
            <Pressable onPress={handleLike} style={styles.actionButton}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? "#ef4444" : "#000"}
              />
            </Pressable>
            <Pressable onPress={handleSave} style={styles.actionButton}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={28}
                color={isSaved ? "#3b82f6" : "#000"}
              />
            </Pressable>
            <Pressable onPress={handleShare} style={styles.actionButton}>
              <Ionicons name="share-outline" size={28} color="#000" />
            </Pressable>
          </View>
          
          <View style={styles.engagementStats}>
            <Text style={styles.statText}>
              <Text style={styles.statNumber}>{likeCount}</Text> likes
            </Text>
            <Text style={styles.statText}>
              <Text style={styles.statNumber}>{saveCount}</Text> saves
            </Text>
          </View>
        </View>

        {/* Caption */}
        {fitpic.caption && (
          <View style={styles.captionSection}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>@{fitpic.author.username}</Text>{' '}
              {fitpic.caption}
            </Text>
          </View>
        )}

        {/* Products */}
        {fitpic.products.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Featured Items</Text>
            {fitpic.products.map((product) => (
              <Pressable
                key={product.id}
                style={styles.productItem}
                onPress={() => onProductPress?.(product)}
              >
                <Image
                  source={{ uri: product.imageUrl || 'https://via.placeholder.com/60' }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  {product.price && (
                    <Text style={styles.productPrice}>
                      ${product.price.toFixed(2)}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Location */}
        {fitpic.location && (
          <View style={styles.locationSection}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.locationText}>{fitpic.location.name}</Text>
          </View>
        )}

        {/* Tags */}
        {fitpic.tags && fitpic.tags.length > 0 && (
          <View style={styles.tagsSection}>
            {fitpic.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>#{tag}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  displayName: {
    fontSize: 12,
    color: '#6b7280',
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  photoContainer: {
    position: 'relative',
    height: screenHeight * 0.5,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: '#ffffff',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  engagementSection: {
    padding: 16,
  },
  engagementActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  actionButton: {
    padding: 4,
  },
  engagementStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#374151',
  },
  statNumber: {
    fontWeight: '600',
  },
  captionSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  captionUsername: {
    fontWeight: '600',
  },
  productsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
