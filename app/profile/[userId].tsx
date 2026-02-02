import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import UserProfileHeader from "../../components/account/UserProfileHeader";
import TabContent from "../../components/account/TabContent";
import TabSwitcher from "../../components/account/TabSwitcher";

import { getAccountTabs } from "../../constants/accountTabs";
import useAccountData from "../../src/hooks/useAccountData";

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId =
    typeof params.userId === "string"
      ? params.userId
      : Array.isArray(params.userId)
        ? params.userId[0]
        : undefined;

  const { data, loading, error, refetch } = useAccountData(userId);

  const tabList = useMemo(
    () => getAccountTabs(data.me?.accountType),
    [data.me?.accountType]
  );

  const initialKey = tabList[0]?.key ?? "fitpics";
  const [activeKey, setActiveKey] = useState(initialKey);

  useEffect(() => {
    setActiveKey((prev) => (prev ? prev : initialKey));
  }, [initialKey]);

  if (!userId) {
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
        <Text style={{ fontSize: 18, marginBottom: 8, color: "#11181C" }}>
          No user specified.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text
            style={{ textDecorationLine: "underline", color: "#11181C" }}
          >
            Go back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity onPress={() => refetch()}>
          <Text
            style={{ textDecorationLine: "underline", color: "#11181C" }}
          >
            Try again
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <UserProfileHeader
        me={data.me}
        counts={data.counts}
        userId={userId}
      />
      <TabSwitcher
        tabs={tabList}
        activeKey={activeKey}
        onChange={setActiveKey}
      />
      <TabContent activeKey={activeKey} userId={userId} />
    </SafeAreaView>
  );
}
