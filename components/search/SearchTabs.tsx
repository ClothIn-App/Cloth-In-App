/**
 * SearchTabs component
 * Tab switcher for search results categories
 */

import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';

export type SearchTabKey = 'top' | 'profiles' | 'fitpics' | 'products' | 'hashtags';

type SearchTab = {
  key: SearchTabKey;
  label: string;
  count?: number; // Optional result count to display
};

type Props = {
  tabs: SearchTab[];
  activeKey: SearchTabKey;
  onChange: (key: SearchTabKey) => void;
};

export default function SearchTabs({ tabs, activeKey, onChange }: Props) {
  const activeBg = '#11181C';
  const inactiveBg = '#F2F2F5';
  const border = '#E3E3E7';
  const activeText = '#FFFFFF';
  const inactiveText = '#11181C';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? activeBg : inactiveBg,
                  borderColor: border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: active ? activeText : inactiveText,
                    fontWeight: active ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <Text
                  style={[
                    styles.countText,
                    {
                      color: active ? '#FFFFFF80' : '#666A70',
                    },
                  ]}
                >
                  {tab.count > 999 ? '999+' : tab.count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
  },
  countText: {
    fontSize: 12,
  },
});

