import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import PublicProfileHeader from "../components/account/PublicProfileHeader";
import TabContent from "../components/account/TabContent";
import TabSwitcher from "../components/account/TabSwitcher";

import { getAccountTabs, type AccountType } from "../constants/accountTabs";
import { usePublicProfile } from "../src/hooks/usePublicProfile";
import useStreakForUser from "../src/hooks/useStreakForUser";
import { userApiClient } from "../src/services/apiClients/userClient";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { data, loading, error, refetch, refreshFollowStatus } = usePublicProfile(userId);
  const { currentStreak, hasPostedToday } = useStreakForUser(
    typeof userId === "string" ? userId : undefined
  );

  // Frontend-only tabs, dynamic by accountType
  // For public profiles, exclude "Saved" tab (only show FitPics and Closet)
  const tabList = useMemo(
    () =>
      getAccountTabs((data?.user.accountType ?? undefined) as AccountType).filter(
        (tab) => tab.key !== "saved"
      ),
    [data?.user.accountType]
  );

  const initialKey = tabList[0]?.key ?? "fitpics";
  const [activeKey, setActiveKey] = useState(initialKey);

  useEffect(() => {
    setActiveKey((prev) => (prev ? prev : initialKey));
  }, [initialKey]);

  const handleFollowChange = () => {
    refreshFollowStatus();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#11181C" }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          backgroundColor: "#FFFFFF",
        }}
        edges={["top", "bottom"]}
      >
        <Text style={{ fontSize: 18, marginBottom: 8, color: "#11181C" }}>
          Couldn't load profile.
        </Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ textDecorationLine: "underline", color: "#11181C" }}>
            Try again
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!data) {
    return null;
  }

  // If private account and not following, show locked message
  if (!data.canViewContent) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
        }}
        edges={["top"]}
      >
        <PublicProfileHeader
          profileData={data}
          onFollowChange={handleFollowChange}
          currentStreak={currentStreak}
          hasPostedToday={hasPostedToday}
        />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Ionicons name="lock-closed" size={48} color="#666A70" />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#11181C",
              marginTop: 16,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            This account is private
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#666A70",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Follow this account to see their FitPics, Closet, and Saved items.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["top"]}>
      <PublicProfileHeader
        profileData={data}
        onFollowChange={handleFollowChange}
        currentStreak={currentStreak}
        hasPostedToday={hasPostedToday}
      />
      <TabSwitcher tabs={tabList} activeKey={activeKey} onChange={setActiveKey} />
      <TabContent activeKey={activeKey} userId={userId} isViewOnly={true} />
    </SafeAreaView>
  );
}
