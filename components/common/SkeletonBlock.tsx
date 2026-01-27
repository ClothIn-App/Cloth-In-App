import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type Props = {
  width: number;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * If true, animates a shimmer sweep + subtle pulse.
   * Keep this lightweight and dependency-free.
   */
  animate?: boolean;
};

export default function SkeletonBlock({
  width,
  height,
  borderRadius = 12,
  style,
  animate = true,
}: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;

    const shimmerAnim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.setValue(0);
    pulse.setValue(0);
    shimmerAnim.start();
    pulseAnim.start();

    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
    };
  }, [animate, pulse, shimmer]);

  const overlayWidth = useMemo(() => Math.max(24, Math.round(width * 0.45)), [width]);
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-overlayWidth, width + overlayWidth],
  });

  const containerOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.88],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          opacity: animate ? containerOpacity : 1,
        },
        style,
      ]}
    >
      {animate && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmerOverlay,
            {
              width: overlayWidth,
              borderRadius,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ECECF1",
    overflow: "hidden",
  },
  shimmerOverlay: {
    position: "absolute",
    top: -2,
    bottom: -2,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
});

