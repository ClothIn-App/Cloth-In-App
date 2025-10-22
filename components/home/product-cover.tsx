import React from "react";
import { Image, View, Text } from "react-native";

const LABEL_H = 44; // adjust to taste

export const PRODUCT_LABEL_HEIGHT = LABEL_H;

export default function Product_Cover({
  width,
  uri,
  brand,
  name,
}: { width: number; uri: string; brand: string; name: string }) {
  return (
    <View style={{ width, overflow: "hidden", borderRadius: 12, backgroundColor: "#fff" }}>
      <Image source={{ uri }} style={{ width, height: width }} resizeMode="cover" />
      <View style={{ height: LABEL_H, backgroundColor: "#fff", justifyContent: "center", paddingHorizontal: 8 }}>
        <Text numberOfLines={1} style={{ fontWeight: "600" }}>{brand}</Text>
        <Text numberOfLines={1} style={{ color: "#555" }}>{name}</Text>
      </View>
    </View>
  );
}
