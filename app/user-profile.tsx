import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

import PublicProfileHeader from "../components/account/PublicProfileHeader";
import TabContent from "../components/account/TabContent";
import TabSwitcher from "../components/account/TabSwitcher";

import { getAccountTabs } from "../constants/accountTabs";
import useAccountData from "../src/hooks/useAccountData";
import session from "../src/mocks/mock-session.json";
import usersData from "../src/mocks/mock-users.json";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const currentUserId = session.currentUserId;

  const { data, loading, error, refetch } = useAccountData(userId);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check privacy and follow status
  const profileUser = useMemo(() => {
    if (!userId) return null;
    return (usersData as Record<string, any>)[userId];
  }, [userId, refreshKey]);

  const currentUser = useMemo(() => {
    return (usersData as Record<string, any>)[currentUserId];
  }, [currentUserId, refreshKey]);

  const isPrivate = profileUser?.privacy?.isPrivateAccount ?? false;
  const isFollowing = currentUser?.following?.userIds?.includes(userId) ?? false;
  const canViewContent = !isPrivate || isFollowing;
  const isReadOnly = userId !== currentUserId;

  const handleFollowStatusChange = () => {
    // Trigger a refresh to update follow status and content visibility
    setRefreshKey(prev => prev + 1);
    refetch();
  };

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
        <Text style={{ fontSize: 18, marginBottom: 8, color: '#11181C' }}>Couldn't load profile.</Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ textDecorationLine: "underline", color: '#11181C' }}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!profileUser) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: '#FFFFFF' }} edges={["top", "bottom"]}>
        <Text style={{ fontSize: 18, marginBottom: 8, color: '#11181C' }}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ textDecorationLine: "underline", color: '#11181C' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      edges={["top"]}
    >
      <PublicProfileHeader 
        user={data.me} 
        userId={userId!}
        isPrivate={isPrivate}
        isFollowing={isFollowing}
        currentUserId={currentUserId}
        onFollowStatusChange={handleFollowStatusChange}
      />
      
      {canViewContent ? (
        <>
          <TabSwitcher tabs={tabList} activeKey={activeKey} onChange={setActiveKey} />
          <TabContent activeKey={activeKey} userId={userId} isReadOnly={isReadOnly} />
        </>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8, color: '#11181C', textAlign: "center" }}>
            This account is private
          </Text>
          <Text style={{ fontSize: 14, color: '#666A70', textAlign: "center", marginBottom: 24 }}>
            Follow this account to see their FitPics, Closet, and Saved items.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
