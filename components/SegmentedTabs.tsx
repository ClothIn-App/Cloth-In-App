/**
 * SegmentedTabs.tsx
 * A generic tab switcher component for toggling between two or more views.
 * Handles its own visual state but delegates selected value to parent via onChange.
 * Example: For You / Following switch on the Home page.
 */

import { Pressable, Text, View } from "react-native";

type Option<T extends string> = { key: T; label: string };
export default function SegmentedTabs<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: Option<T>[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {options.map(o => (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center",
            backgroundColor: value === o.key ? "#000" : "#eee",
          }}>
          <Text style={{ color: value === o.key ? "#fff" : "#000", fontWeight: "600" }}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
