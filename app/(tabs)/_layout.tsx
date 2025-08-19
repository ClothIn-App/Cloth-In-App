// app/(tabs)/_layout.tsx
import { IconSymbol } from "@/components/ui/IconSymbol"; // adjust if your icon helper lives elsewhere
import { Tabs } from "expo-router";
import React from "react";

import {
  CreateSheetProvider,
  useCreateSheet,
} from "../../src/context/CreateSheetContext";

const ACTIVE_TINT = "black";
const INACTIVE_TINT = "gray";

function TabsInner() {
  const { open } = useCreateSheet();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: { backgroundColor: "white", borderTopColor: "#ccc" },
      }}
    >
      {/* 1. Home */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="house" color={color} size={28} />
          ),
        }}
      />

      {/* 2. Product */}
      <Tabs.Screen
        name="product"
        options={{
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="bag" color={color} size={28} />
          ),
        }}
      />

      {/* 3. Create (icon aligned like others; intercept press to open sheet) */}
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="plus.diamond.fill" color={ACTIVE_TINT} size={30} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // keep current tab focused
            open();             // open the bottom sheet
          },
        }}
      />

      {/* 4. Search */}
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size }) => (
            <IconSymbol
              name="magnifyingglass"
              color={color}
              size={28}
            />
          ),
        }}
      />

      {/* 5. Account */}
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="person" color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <CreateSheetProvider>
      <TabsInner />
    </CreateSheetProvider>
  );
}
