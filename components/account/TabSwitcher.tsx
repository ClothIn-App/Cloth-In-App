import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { AccountTab } from "../../constants/accountTabs";

type Props = {
  tabs: AccountTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export default function TabSwitcher({ tabs, activeKey, onChange }: Props) {
  const activeBg = '#E1E1E6';
  const inactiveBg = '#F2F2F5';
  const border = '#E3E3E7';
  const text = '#11181C';

  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {tabs.map((t) => {
          const active = t.key === activeKey;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => onChange(t.key)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: active ? activeBg : inactiveBg,
                borderWidth: 1,
                borderColor: border,
                alignItems: "center",
              }}
            >
              <Text style={{ color: text, fontWeight: active ? "600" : "400" }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
