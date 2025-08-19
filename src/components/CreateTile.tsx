// src/components/create/CreateTile.tsx
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  bold?: boolean; 
  onPress: () => void;
  testID?: string;
};

export function CreateTile({ title, subtitle, bold, onPress, testID }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={onPress} testID={testID}>
      <View>
        <Text style={[styles.title, bold && styles.bold]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "white",
    marginBottom: 12,
  },
  pressed: { opacity: 0.8 },
  title: { fontSize: 18, fontWeight: "600" },
  bold: { fontWeight: "800" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#6b7280" },
});
