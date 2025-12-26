import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { ImageSourcePropType } from 'react-native';
import ProgressiveImage from '../common/ProgressiveImage';

type Props = {
  productId: string;
  imageSource: ImageSourcePropType;
  brand: string;
  name: string;
  price: number | null;
  salePrice: number | null;
  onPress: (productId: string) => void;
};

const formatPrice = (v: number | null): string => {
  if (v == null) return '';
  return typeof v === 'number' ? `$${v.toFixed(2)}` : String(v);
};

export default function FeaturedProductCard({
  productId,
  imageSource,
  brand,
  name,
  price,
  salePrice,
  onPress,
}: Props) {
  const priceText = formatPrice(salePrice ?? price);
  const displayPrice = salePrice && salePrice < (price ?? 0) ? salePrice : price;

  return (
    <Pressable
      onPress={() => onPress(productId)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      {/* Image (square) */}
      <View style={styles.imageContainer}>
        <ProgressiveImage 
          source={imageSource} 
          style={styles.image} 
          contentFit="cover"
        />

        {/* Price badge */}
        {priceText && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{priceText}</Text>
          </View>
        )}
      </View>

      {/* Label box: brand (bold) on first line, product name below */}
      <View style={styles.labelContainer}>
        <Text numberOfLines={1} style={styles.brandText}>
          {brand}
        </Text>
        <Text numberOfLines={1} style={styles.nameText}>
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E6E9',
  },
  pressed: {
    opacity: 0.7,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  priceText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  labelContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  brandText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#111',
    marginBottom: 2,
  },
  nameText: {
    color: '#5A5A5F',
    fontSize: 11,
    lineHeight: 14,
  },
});

