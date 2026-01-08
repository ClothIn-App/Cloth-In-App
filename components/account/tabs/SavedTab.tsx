import React from "react";
import { View, Text } from "react-native";

type Props = {
  userId?: string;
};

export default function SavedTab({ userId }: Props) {
  const border = '#E3E3E7';
  const muted = '#666A70';

  return (
    <View
      style={{
        flex: 1,
        margin: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: '#11181C' }}>
        No saved posts
      </Text>
      <Text style={{ color: muted, textAlign: "center" }}>
        Save posts to view them here.
      </Text>
    </View>
  );
}

