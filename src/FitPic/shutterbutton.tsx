import React, { useRef } from 'react';
import { Pressable, View, Animated, StyleSheet } from 'react-native';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  /** Diameter of the white inner circle */
  size?: number;
  /** Thickness of the very outside black ring */
  outerRing?: number;
  /** White gap between outer ring and inner ring */
  gap?: number;
  /** Thickness of the inner black ring around the white circle */
  innerRing?: number;
};

export default function ShutterButton({
  onPress,
  disabled = false,
  size = 72,
  outerRing = 2,
  gap = 3,
  innerRing = 2,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      hitSlop={16}
      style={styles.touch}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.4 : 1 }}>
        {/* Outer black ring with a white gap */}
        <View
          style={[
            styles.outerRing,
            {
              borderWidth: outerRing,
              borderRadius: size / 2 + gap + outerRing,
              padding: gap, // this creates the white gap
            },
          ]}
        >
          {/* White circle with a thin black ring */}
          <View
            style={[
              styles.innerCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: innerRing,
              },
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    borderColor: '#000',
    backgroundColor: '#fff', // ensures the gap looks white
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    backgroundColor: '#fff',
    borderColor: '#000',
  },
});
