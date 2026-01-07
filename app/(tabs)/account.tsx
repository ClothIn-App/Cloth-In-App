import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ProfileHeader from "../../components/account/ProfileHeader";
import TabContent from "../../components/account/TabContent";
import TabSwitcher from "../../components/account/TabSwitcher";

import { getAccountTabs } from "../../constants/accountTabs";
import useAccountData from "../../src/hooks/useAccountData";
import session from "../../src/mocks/mock-session.json";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();

  // TODO: pull from your real auth context
  const userId = session.currentUserId;

  const { data, loading, error, refetch } = useAccountData(userId);

  // Frontend-only tabs, dynamic by accountType
  const tabList = useMemo(
    () => getAccountTabs(data.me?.accountType),
    [data.me?.accountType]
  );

  const initialKey = tabList[0]?.key ?? "fitpics";
  const [activeKey, setActiveKey] = useState(initialKey);

  useEffect(() => {
    setActiveKey((prev) => (prev ? prev : initialKey));
  }, [initialKey]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#FFFFFF' }} edges={["top", "bottom"]}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: '#11181C' }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: '#FFFFFF' }} edges={["top", "bottom"]}>
        <Text style={{ fontSize: 18, marginBottom: 8, color: '#11181C' }}>Couldn't load account.</Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ textDecorationLine: "underline", color: '#11181C' }}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, paddingBottom: insets.bottom, backgroundColor: '#FFFFFF' }}
      edges={["top", "bottom"]}
    >
      <ProfileHeader me={data.me} />
      <TabSwitcher tabs={tabList} activeKey={activeKey} onChange={setActiveKey} />
      <TabContent activeKey={activeKey} userId={userId} />
    </SafeAreaView>
  );
}
