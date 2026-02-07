// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Home_Grid from "../../components/home/home-grid";
import StreakDrawer from "../../components/home/StreakDrawer";
import SegmentedTabs from "../../components/SegmentedTabs";
import { getCurrentUserId } from "../../src/services/mockSessionUsers";
import { fitpicClient } from "../../src/services/apiClients/fitpicClient";
import { computeStreakStats } from "../../src/utils/streakUtils";

type FeedType = "forYou" | "following";

export default function HomeScreen() {
  const [feedType, setFeedType] = useState<FeedType>("forYou");
  const [streakDrawerOpen, setStreakDrawerOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      setCurrentStreak(0);
      return;
    }
    fitpicClient
      .listByUser(userId, undefined, 200)
      .then((res) => {
        if (!res.success || !res.fitpics) {
          setCurrentStreak(0);
          return;
        }
        const byDate: Record<string, unknown> = {};
        for (const fp of res.fitpics) {
          const d = new Date(fp.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          byDate[key] = true;
        }
        const { currentStreak: streak } = computeStreakStats(Object.keys(byDate));
        setCurrentStreak(streak);
      })
      .catch(() => setCurrentStreak(0));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Custom Header: streak left, search right */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.streakButton}
          onPress={() => setStreakDrawerOpen(true)}
        >
          <Ionicons
            name={currentStreak === 0 ? "flame-outline" : "flame"}
            size={24}
            color={currentStreak === 0 ? "#9CA3AF" : "#FF6B35"}
          />
          <Text style={[styles.streakNumber, currentStreak === 0 && styles.streakNumberZero]}>
            {currentStreak}
          </Text>
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
  streakNumberZero: {
    color: '#9CA3AF',
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
