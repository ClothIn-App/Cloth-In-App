import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
  /** Call this to navigate to the Camera Roll (pager index 0) */
  onOpen?: () => void;
  /** Optional extra styles for the outer container */
  style?: ViewStyle;
  /** Optional: increase touch target without changing visual size */
  hitSlop?: { top?: number; right?: number; bottom?: number; left?: number };
};

const GallerButton: React.FC<Props> = ({ onOpen, style, hitSlop }) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Open Camera Roll"
      onPress={onOpen}
      activeOpacity={0.7}
      hitSlop={hitSlop ?? { top: 8, right: 8, bottom: 8, left: 8 }}
      style={[styles.button, style]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="image-multiple-outline" size={22} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', // readable over camera preview
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GallerButton;
