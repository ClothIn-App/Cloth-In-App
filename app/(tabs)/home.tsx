// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Home_Grid from "../../components/home/home-grid";
import StreakDrawer from "../../components/home/StreakDrawer";
import FeedTypeDropdown, { type FeedType } from "../../components/home/FeedTypeDropdown";
import { getCurrentUserId } from "../../src/services/mockSessionUsers";
import { fitpicClient } from "../../src/services/apiClients/fitpicClient";
import { computeStreakStats } from "../../src/utils/streakUtils";

const FEED_TYPE_LABELS: Record<FeedType, string> = {
  forYou: "For You",
  following: "Following",
  browse: "Browse",
};

export default function HomeScreen() {
  const [feedType, setFeedType] = useState<FeedType>("forYou");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
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

      {/* Custom Header: streak left, feed selector center, search right */}
      <View
        style={styles.headerContainer}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
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
          style={styles.feedSelector}
          onPress={() => setDropdownVisible((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Text style={styles.feedSelectorLabel}>{FEED_TYPE_LABELS[feedType]}</Text>
          <Ionicons name="chevron-down" size={20} color="#11181C" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/search-modal')}
          style={styles.searchButton}
        >
          <Ionicons name="search-outline" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {/* Home Grid with Feed Data */}
      <Home_Grid feedType={feedType} />

      {dropdownVisible && (
        <FeedTypeDropdown
          visible={dropdownVisible}
          onClose={() => setDropdownVisible(false)}
          value={feedType}
          onSelect={setFeedType}
          headerBottomY={headerHeight || 56}
        />
      )}

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
  feedSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  feedSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
});
