import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  width: number;
  borderRadius?: number;
  text?: string;
};

export default function ClosetPlaceholderCard({
  width,
  borderRadius = 16,
  text = "Post FitPic's to Add to Closet!",
}: Props) {
  // Height matches ClosetProductCard's aspect ratio
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
      {!!text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D0D0D0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
    fontWeight: "400",
  },
});
