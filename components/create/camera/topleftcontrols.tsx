// app/src/fitpic/topleftcontrols.tsx
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

type Props = {
  /**
   * Optional override. If provided, this is called instead of router.back().
   */
  onPressExit?: () => void;
};

/**
 * Top-left close control for the camera screen.
 * Pressing the ✕ returns to the previous screen (pre-Create flow).
 */
export default function TopLeftControls({ onPressExit }: Props) {
  const insets = useSafeAreaInsets();

  const handlePress = React.useCallback(() => {
    if (onPressExit) {
      onPressExit();
    } else {
      router.back();
    }
  }, [onPressExit]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}
    >
      <Pressable
        onPress={handlePress}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel="Close camera"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        {/* CHANGE SIZE HERE: fontSize/lineHeight control how big the X appears */}
        <Text style={styles.x}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    top: 0,
    zIndex: 1000,
  },
  // No bubble (no background/shape)
  button: {},
  pressed: {
    opacity: 0.7,
  },
  x: {
    color: '#fff',
    fontSize: 32,     // ← increase/decrease this to change size
    fontWeight: '700',
    lineHeight: 32,   // ← keep in sync with fontSize for crisp rendering
  },
});