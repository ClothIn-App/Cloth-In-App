// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import SegmentedTabs from "../../components/SegmentedTabs";
import FitPicGrid from "../../src/components/FitPicGrid";
import FitPicDetailModal from "../../src/components/FitPicDetailModal";
import { useAuth } from "../../src/context/AuthContext";
import { useFitPicFeed } from "../../src/hooks/useFitPicFeed";
import type { FitPic } from "../../src/types/fitpic";

export default function HomeScreen() {
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const [selectedFitPic, setSelectedFitPic] = useState<FitPic | null>(null);
  const { auth } = useAuth();
  
  const {
    fitpics,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    handleLike,
    handleSave,
  } = useFitPicFeed(tab);

  // fall back to mock until API integrated
  const displayName =
    auth?.user?.email || auth?.user?.uid || "Mock User";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* 👇 Welcome message */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Welcome {displayName}
        </Text>
      </View>

      <Header title="Home" />

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { key: "forYou", label: "For You" },
            { key: "following", label: "Following" },
          ]}
        />
      </View>
      <FitPicGrid
        fitpics={fitpics}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onFitPicPress={setSelectedFitPic}
        emptyMessage="No fit pics yet"
        emptySubtitle="Discover amazing styles from the community!"
      />
      
      {/* FitPic Detail Modal */}
      <FitPicDetailModal
        fitpic={selectedFitPic}
        visible={!!selectedFitPic}
        onClose={() => setSelectedFitPic(null)}
        onLike={handleLike}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
