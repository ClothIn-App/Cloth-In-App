import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type OtherUserTab = 'fitpics' | 'closet';

type Props = {
  activeTab: OtherUserTab;
  onChange: (tab: OtherUserTab) => void;
};

const TABS: { key: OtherUserTab; label: string }[] = [
  { key: 'fitpics', label: 'FitPics' },
  { key: 'closet', label: 'Closet' },
];

const activeBg = '#E1E1E6';
const inactiveBg = '#F2F2F5';
const border = '#E3E3E7';
const text = '#11181C';

export default function OtherUserProfileTabBar({ activeTab, onChange }: Props) {
  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TABS.map((t) => {
          const active = t.key === activeTab;
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
                alignItems: 'center',
              }}
            >
              <Text style={{ color: text, fontWeight: active ? '600' : '400' }}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
