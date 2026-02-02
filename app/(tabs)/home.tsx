// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { GestureHandlerRootView, PanGestureHandler, State } from "react-native-gesture-handler";
import Home_Grid from "../../components/home/home-grid";
import SegmentedTabs from "../../components/SegmentedTabs";
import MemoriesDrawer from "../../components/memories/MemoriesDrawer";
import { useStreakData } from "../../src/hooks/useStreakData";

type FeedType = "forYou" | "following";

export default function HomeScreen() {
  const [feedType, setFeedType] = useState<FeedType>("forYou");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { currentStreak, loading } = useStreakData();
  const streakOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(streakOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      streakOpacity.setValue(0);
    }
  }, [loading, streakOpacity]);

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
        <StatusBar style="dark" />

        <PanGestureHandler
          onHandlerStateChange={(event) => {
            const { translationX, state } = event.nativeEvent;
            if (state === State.END && translationX > 50 && !drawerVisible) {
              handleOpenDrawer();
            }
          }}
          activeOffsetX={[-1000, 10]}
          failOffsetY={[-50, 50]}
        >
          <View style={{ flex: 1 }}>
            {/* Custom Header with streak icon, and search */}
            <View style={styles.headerContainer}>
              <TouchableOpacity 
                style={styles.streakButton}
                onPress={handleOpenDrawer}
              >
                <Ionicons name="flame" size={24} color="#FF6B35" />
                <View style={styles.streakNumberSlot}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FF6B35" />
                  ) : (
                    <Animated.Text
                      style={[styles.streakNumber, { opacity: streakOpacity }]}
                    >
                      {currentStreak}
                    </Animated.Text>
                  )}
                </View>
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  onPress={() => router.push('/search-modal')} 
                  style={styles.searchButton}
                >
                  <Ionicons name="search-outline" size={24} color="#11181C" />
                </TouchableOpacity>
              </View>
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
          </View>
        </PanGestureHandler>

        {/* Memories Drawer */}
        <MemoriesDrawer visible={drawerVisible} onClose={handleCloseDrawer} />
      </SafeAreaView>
    </GestureHandlerRootView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 2,
    alignSelf: 'flex-start',
  },
  streakNumberSlot: {
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
