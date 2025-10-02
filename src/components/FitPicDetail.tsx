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
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import EmojiReaction from './EmojiReaction';
import EmojiPicker from './EmojiPicker';
import type { FitPic, EmojiReaction as EmojiReactionType } from '../types/fitpic';

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
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(fitpic.engagement.isLiked || false);
  const [isSaved, setIsSaved] = useState(fitpic.engagement.isSaved || false);
  const [likeCount, setLikeCount] = useState(fitpic.engagement.likes);
  const [saveCount, setSaveCount] = useState(fitpic.engagement.saves);
  const [reactions, setReactions] = useState(fitpic.engagement.reactions || []);
  const [userReactions, setUserReactions] = useState(fitpic.engagement.userReactions || []);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleEmojiReaction = (emoji: string) => {
    const isCurrentlyReacted = userReactions.includes(emoji);
    
    if (isCurrentlyReacted) {
      // Remove reaction
      setUserReactions(prev => prev.filter(e => e !== emoji));
      setReactions(prev => 
        prev.map(r => 
          r.emoji === emoji 
            ? { ...r, count: Math.max(0, r.count - 1) }
            : r
        ).filter(r => r.count > 0)
      );
    } else {
      // Add reaction
      setUserReactions(prev => [...prev, emoji]);
      setReactions(prev => {
        const existingReaction = prev.find(r => r.emoji === emoji);
        if (existingReaction) {
          return prev.map(r => 
            r.emoji === emoji 
              ? { ...r, count: r.count + 1 }
              : r
          );
        } else {
          return [...prev, { emoji, count: 1, users: [] }];
        }
      });
    }
  };

  const handleAddReaction = () => {
    setShowEmojiPicker(true);
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

  const handlePanGesture = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === State.END) {
      // If swiped right more than 100px, close the modal
      if (translationX > 100) {
        onClose();
      }
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={handlePanGesture}>
    <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          onScroll={(event) => setScrollY(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        >
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
          </Pressable>
        </View>
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
              {fitpic.photos.map((photo, index) => (
                <View
                  key={photo.id}
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

          {/* Report Button */}
          <Pressable style={styles.reportButton} onPress={handleReport}>
            <Ionicons name="flag-outline" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Engagement Actions */}
        <View style={styles.engagementSection}>
          <View style={styles.engagementActions}>
            <Pressable onPress={handleSave} style={styles.actionButton}>
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={28}
                color={isSaved ? "#3b82f6" : "#000"}
              />
            </Pressable>
            <Pressable onPress={handleAddReaction} style={styles.actionButton}>
              <Ionicons name="add-circle-outline" size={28} color="#000" />
            </Pressable>
            <Pressable onPress={handleShare} style={styles.actionButton}>
              <Ionicons name="share-outline" size={28} color="#000" />
            </Pressable>
          </View>
          
          {/* Emoji Reactions */}
          {reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {reactions.map((reaction) => (
                <EmojiReaction
                  key={reaction.emoji}
                  reaction={reaction}
                  isSelected={userReactions.includes(reaction.emoji)}
                  onPress={handleEmojiReaction}
                />
              ))}
            </View>
          )}
          
          <View style={styles.engagementStats}>
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

      </ScrollView>
      
      {/* Emoji Picker Modal */}
      <EmojiPicker
        visible={showEmojiPicker}
        onEmojiSelect={handleEmojiReaction}
        onClose={() => setShowEmojiPicker(false)}
      />
    </SafeAreaView>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  reportButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 8,
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
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  engagementStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
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
});
