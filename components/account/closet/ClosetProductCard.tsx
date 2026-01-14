import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import ProgressiveImage from "../../common/ProgressiveImage";

type Props = {
  source: ImageSourcePropType;
  width: number;
  borderRadius?: number;
};

export default function ClosetProductCard({
  source,
  width,
  borderRadius = 16,
}: Props) {
  // Height is slightly taller than width for wardrobe item look
  const height = width * 1.15;

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
      ]}
    >
      <ProgressiveImage
        source={source}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
