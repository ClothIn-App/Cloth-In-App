import React from "react";
import { Image, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or: import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  width: number;
  height: number;
  source: any;                 // local require(...) or { uri }
  tagCount?: number;           // number of featured products
};

export default function FitPic_Cover({ width, height, source, tagCount = 0 }: Props) {
  return (
    <View style={{ width, height, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff" }}>
      <Image source={source} style={{ width, height }} resizeMode="contain" />
      {/* Bottom-left overlay: pricetag icon + count */}
      <View
        style={{
          position: "absolute",
          left: 8,
          bottom: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: "rgba(0,0,0,0.65)",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Ionicons name="pricetag-outline" size={14} color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{tagCount}</Text>
      </View>
    </View>
  );
}
