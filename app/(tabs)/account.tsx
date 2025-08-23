import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileHeader from "../../components/account/ProfileHeader";
import TabContent from "../../components/account/TabContent";
import TabSwitcher from "../../components/account/TabSwitcher";

import useAccountData from "../../src/hooks/useAccountData";

export default function AccountScreen() {
  const { data, loading, error, refetch } = useAccountData();
  const insets = useSafeAreaInsets();

  // Build the tab list from mock/API; fallback to a fixed list if nothing arrives
  const tabList = useMemo(
    () =>
      data.tabs?.tabs ?? [
        { key: "fitpics", label: "FitPics" },
        { key: "closet", label: "Closet" },
        { key: "products", label: "Products" },
        { key: "following", label: "Following" },
        { key: "followers", label: "Followers" },
      ],
    [data.tabs]
  );

  // Default tab: from payload if present, otherwise first tab
  const initialKey = data.tabs?.defaultKey ?? tabList[0]?.key ?? "fitpics";
  const [activeKey, setActiveKey] = useState(initialKey);

  // If the payload’s defaultKey changes (or tabs arrive later), sync state once
  useEffect(() => {
    setActiveKey((prev) => (prev ? prev : initialKey));
  }, [initialKey]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }} edges={["top", "bottom"]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }} edges={["top", "bottom"]}>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Couldn’t load account.</Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ textDecorationLine: "underline" }}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
      edges={["top", "bottom"]}
    >
      <ProfileHeader me={data.me} counts={data.counts} />
      <TabSwitcher tabs={tabList} activeKey={activeKey} onChange={setActiveKey} />
      <TabContent activeKey={activeKey} />
    </SafeAreaView>
  );
}
