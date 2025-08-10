import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import PinGrid from "../../components/PinGrid";
import SegmentedTabs from "../../components/SegmentedTabs";
import { useFeed } from "../../src/hooks/useFeed";

export default function HomeScreen() {
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const { data, loading } = useFeed(tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />
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
      <PinGrid posts={data} loading={loading} />
    </SafeAreaView>
  );
}
