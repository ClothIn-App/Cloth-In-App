import React from "react";
import { Text, View } from "react-native";

export default function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }}>{title}</Text>
      {subtitle ? <Text style={{ opacity: 0.7, textAlign: "center" }}>{subtitle}</Text> : null}
    </View>
  );
}
