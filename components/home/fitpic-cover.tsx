import React from "react";
import { Image, View } from "react-native";

export default function FitPic_Cover({
  width,
  height,
  uri,
}: { width: number; height: number; uri: string }) {
  return (
    <View style={{ width, height, overflow: "hidden", borderRadius: 12, backgroundColor: "#fff" }}>
      <Image source={{ uri }} style={{ width, height }} resizeMode="contain" />
    </View>
  );
}