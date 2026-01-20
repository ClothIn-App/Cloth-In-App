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
  text = "",
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
    backgroundColor: "#F2F3F5",
    borderWidth: 1,
    borderColor: "#E3E3E7",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 12,
    color: "#666A70",
    textAlign: "center",
    fontWeight: "400",
  },
});
