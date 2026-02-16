// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Home_Grid from "../../components/home/home-grid";
import StreakDrawer from "../../components/home/StreakDrawer";
import FeedTypeDropdown, { type FeedType } from "../../components/home/FeedTypeDropdown";
import { getCurrentUserId } from "../../src/services/mockSessionUsers";
import { fitpicClient } from "../../src/services/apiClients/fitpicClient";
import { computeStreakStats } from "../../src/utils/streakUtils";

const EDGE_SWIPE_WIDTH = 32;

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
  const [hasPostedToday, setHasPostedToday] = useState(false);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      setCurrentStreak(0);
      setHasPostedToday(false);
      return;
    }
    fitpicClient
      .listByUser(userId, undefined, 200)
      .then((res) => {
        if (!res.success || !res.fitpics) {
          setCurrentStreak(0);
          setHasPostedToday(false);
          return;
        }
        const byDate: Record<string, unknown> = {};
        for (const fp of res.fitpics) {
          const d = new Date(fp.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          byDate[key] = true;
        }
        const { currentStreak: streak, hasPostedToday: postedToday } = computeStreakStats(Object.keys(byDate));
        setCurrentStreak(streak);
        setHasPostedToday(postedToday);
      })
      .catch(() => {
        setCurrentStreak(0);
        setHasPostedToday(false);
      });
  }, []);

  const streakActive = currentStreak > 0 && hasPostedToday;
  const { width: screenWidth } = useWindowDimensions();
  const openThreshold = screenWidth * 0.25;
  const openStreakDrawer = useCallback(() => setStreakDrawerOpen(true), []);

  const edgeSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(20)
        .onEnd((e) => {
          if (e.translationX >= openThreshold) {
            runOnJS(openStreakDrawer)();
          }
        }),
    [openThreshold, openStreakDrawer]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />

      <View style={styles.contentWrapper}>
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
              name={streakActive ? "flame" : "flame-outline"}
              size={24}
              color={streakActive ? "#FF6B35" : "#9CA3AF"}
            />
            <Text style={[styles.streakNumber, !streakActive && styles.streakNumberZero]}>
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

        {/* Left-edge strip: swipe right ~25% of screen to open Streak Drawer */}
        <GestureDetector gesture={edgeSwipeGesture}>
          <View style={[styles.edgeSwipeStrip, { width: EDGE_SWIPE_WIDTH }]} />
        </GestureDetector>
      </View>

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
  contentWrapper: {
    flex: 1,
  },
  edgeSwipeStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
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
