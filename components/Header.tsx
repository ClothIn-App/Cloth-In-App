/**
 * Header.tsx
 * A simple reusable header bar for screens.
 * Displays a title and optional styles; no business logic.
 * Example use: <Header title="Home" />
 */

import { Text, View } from "react-native";
export default function Header({ title }: { title: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: "#e5e5e5" }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{title}</Text>
    </View>
  );
}
