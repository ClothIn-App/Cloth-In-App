/**
 * ProductDetailModal Component
 * Displays product details in a modal overlay with enhanced UI
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductPhotoCarousel from './ProductPhotoCarousel';
import ProductPriceDisplay from './ProductPriceDisplay';
import ProductReactions from './ProductReactions';
import FeaturedFitPics from './FeaturedFitPics';
import CollapsibleText from './CollapsibleText';
import { getFitPicsForProduct } from '../services/productFitPicService';
import type { ProductSearchResult } from '../types/search';
import type { FitPic } from '../types/fitpic';

type Props = {
  product: ProductSearchResult | null;
  visible: boolean;
  onClose: () => void;
  onFitPicPress?: (fitpic: FitPic) => void;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProductDetailModal({ product, visible, onClose, onFitPicPress }: Props) {
  // Debug logging
  React.useEffect(() => {
    console.log('ProductDetailModal - visible:', visible, 'product:', product?.id);
  }, [visible, product]);

  if (!product) {
    console.log('ProductDetailModal - no product, returning null');
    return null;
  }

  // Get fitpics that feature this product with error handling
  let featuredFitpics: FitPic[] = [];
  try {
    featuredFitpics = getFitPicsForProduct(product.id);
  } catch (error) {
    console.warn('Error loading featured fitpics:', error);
    featuredFitpics = [];
  }

  const handlePurchase = () => {
    if (product.purchaseUrl) {
      Linking.openURL(product.purchaseUrl);
    }
  };

  const handleReaction = (emoji: string) => {
    console.log('Product reaction:', emoji, 'for product:', product.id);
    // In a real app, this would call an API to save the reaction
    // For now, we'll just log it
  };

  const renderPurchaseButton = () => {
    if (!product.purchaseUrl || product.priceStatus === 'Sold Out' || product.priceStatus === 'N/A') {
      return null;
    }

    const buttonText = product.priceStatus === 'TBD' ? 'Notify Me' : 'Shop Now';
    
    return (
      <TouchableOpacity 
        style={[
          styles.purchaseButton,
          product.priceStatus === 'TBD' && styles.notifyButton
        ]}
        onPress={handlePurchase}
      >
        <Text style={styles.purchaseButtonText}>{buttonText}</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              console.log('ProductDetailModal - close button pressed');
              onClose();
            }} 
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Images Carousel */}
          {product.images && product.images.length > 0 ? (
            <ProductPhotoCarousel images={product.images} />
          ) : product.imageUrl ? (
            <View style={styles.fallbackImageContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.fallbackImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.fallbackImageContainer}>
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                <Text style={styles.noImageText}>No Image Available</Text>
              </View>
            </View>
          )}

          {/* Product Info */}
          <View style={styles.infoContainer}>
            {/* Brand and Category */}
            <View style={styles.brandCategoryContainer}>
              {product.brand && (
                <Text style={styles.brandText}>{product.brand}</Text>
              )}
              {product.category && (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{product.category}</Text>
                </View>
              )}
            </View>
            
            {/* Product Name */}
            <Text style={styles.nameText}>{product.name}</Text>
            
            {/* Price Display */}
            <ProductPriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              currency={product.currency}
              priceStatus={product.priceStatus}
            />

            {/* Reactions */}
            <ProductReactions
              reactions={product.reactions}
              userReactions={product.userReactions}
              onReaction={handleReaction}
            />

            {/* Purchase Button */}
            {renderPurchaseButton()}

            {/* Description */}
            {product.description && (
              <CollapsibleText
                text={product.description}
                title="Description"
                maxLines={3}
              />
            )}

            {/* Specifications */}
            {product.specifications && (
              <CollapsibleText
                text={product.specifications}
                title="Specifications"
                maxLines={2}
              />
            )}


            {/* Featured FitPics */}
            <FeaturedFitPics
              fitpics={featuredFitpics}
              onFitPicPress={onFitPicPress}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  fallbackImageContainer: {
    width: screenWidth,
    height: screenWidth * 1.2,
  },
  fallbackImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 24,
  },
  brandCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nameText: {
    fontSize: 24,
    color: '#11181C',
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 32,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11181C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  notifyButton: {
    backgroundColor: '#F59E0B',
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
