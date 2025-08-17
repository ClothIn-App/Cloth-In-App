// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import PinGrid from "../../components/PinGrid";
import SegmentedTabs from "../../components/SegmentedTabs";
import { useAuth } from "../../src/context/AuthContext";
import { useFeed } from "../../src/hooks/useFeed";

export default function HomeScreen() {
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const { data, loading } = useFeed(tab);
  const { auth } = useAuth();

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
      <PinGrid posts={data} loading={loading} />
    </SafeAreaView>
  );
}
