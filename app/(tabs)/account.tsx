import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import ProfileHeader from "../../components/account/ProfileHeader";
import TabContent from "../../components/account/TabContent";
import TabSwitcher from "../../components/account/TabSwitcher";

import { getAccountTabs } from "../../constants/accountTabs";
import useAccountData from "../../src/hooks/useAccountData";
import { useCurrentUserId } from "../../src/hooks/useCurrentUserId";
import useStreakForUser from "../../src/hooks/useStreakForUser";

export default function AccountScreen() {
  const { userId, loading: authLoading } = useCurrentUserId();

  const { data, loading, error, refetch } = useAccountData(userId);
  const { currentStreak, hasPostedToday } = useStreakForUser(userId);

  // Frontend-only tabs, dynamic by accountType
  const tabList = useMemo(
    () => getAccountTabs(data.me?.accountType),
    [data.me?.accountType]
  );

  const initialKey = tabList[0]?.key ?? "fitpics";
  const [activeKey, setActiveKey] = useState(initialKey);
  const isFirstFocus = useRef(true);

  useEffect(() => {
    setActiveKey((prev) => (prev ? prev : initialKey));
  }, [initialKey]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (userId) refetch();
    }, [userId, refetch])
  );

  if (authLoading || loading) {
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

  if (!userId) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: '#FFFFFF' }} edges={["top", "bottom"]}>
        <Text style={{ fontSize: 18, marginBottom: 8, color: '#11181C' }}>Couldn't resolve current user.</Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ textDecorationLine: "underline", color: '#11181C' }}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      edges={["top"]}
    >
      <ProfileHeader
        me={data.me}
        counts={data.counts}
        currentStreak={currentStreak}
        hasPostedToday={hasPostedToday}
        onFollowChange={refetch}
      />
      <TabSwitcher tabs={tabList} activeKey={activeKey} onChange={setActiveKey} />
      <TabContent activeKey={activeKey} userId={userId} />
    </SafeAreaView>
  );
}
