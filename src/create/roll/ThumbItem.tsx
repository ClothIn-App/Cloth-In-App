// src/create/roll/ThumbItem.tsx
import React, { memo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { AssetLite } from './types';

type ThumbItemProps = {
  asset: AssetLite;
  isSelected: boolean;
  selectionIndex: number | null; // 1-based index when selected
  onPress: (asset: AssetLite) => void;
  size: number;
};

const ThumbItem = memo(function ThumbItem({
  asset,
  isSelected,
  selectionIndex,
  onPress,
  size,
}: ThumbItemProps) {
  return (
    <Pressable
      onPress={() => onPress(asset)}
      style={[
        styles.cell,
        { width: size, height: size },
        isSelected && styles.selected,
      ]}
    >
      <Image source={{ uri: asset.uri }} style={styles.image} contentFit="cover" />
      
      {/* Selection indicator */}
      {isSelected && selectionIndex != null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectionIndex}</Text>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ThumbItem;
