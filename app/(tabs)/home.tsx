// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Home_Grid from "../../components/home/home-grid";
import StreakDrawer from "../../components/home/StreakDrawer";
import SegmentedTabs from "../../components/SegmentedTabs";

type FeedType = "forYou" | "following";

export default function HomeScreen() {
  const [feedType, setFeedType] = useState<FeedType>("forYou");
  const [streakDrawerOpen, setStreakDrawerOpen] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Custom Header: streak left, search right */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.streakButton}
          onPress={() => setStreakDrawerOpen(true)}
        >
          <Ionicons name="flame" size={24} color="#FF6B35" />
          <Text style={styles.streakNumber}>7</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/search-modal')}
          style={styles.searchButton}
        >
          <Ionicons name="search-outline" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher: For You / Following */}
      <View style={styles.tabsContainer}>
        <SegmentedTabs
          value={feedType}
          onChange={(value) => setFeedType(value as FeedType)}
          options={[
            { key: "forYou", label: "For You" },
            { key: "following", label: "Following" },
          ]}
        />
      </View>

      {/* Home Grid with Feed Data */}
      <Home_Grid feedType={feedType} />

      <StreakDrawer
        visible={streakDrawerOpen}
        onClose={() => setStreakDrawerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  searchButton: {
    padding: 8,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
});
