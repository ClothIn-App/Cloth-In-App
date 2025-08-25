import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { AccountTab } from "../../constants/accountTabs";
import { useThemeColor } from "../../hooks/useThemeColor";

type Props = {
  tabs: AccountTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export default function TabSwitcher({ tabs, activeKey, onChange }: Props) {
  const activeBg = useThemeColor({}, "pillActive");
  const inactiveBg = useThemeColor({}, "pillInactive");
  const border = useThemeColor({}, "border");
  const text = useThemeColor({}, "text");

  return (
    <View style={{ paddingVertical: 8 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      >
        {tabs.map((t) => {
          const active = t.key === activeKey;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => onChange(t.key)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: active ? activeBg : inactiveBg,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <Text style={{ color: text, fontWeight: active ? "600" : "400" }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
