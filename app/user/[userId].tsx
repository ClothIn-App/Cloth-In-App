import React, { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import useOtherUserProfileData from '../../src/hooks/useOtherUserProfileData';
import useStreakForUser from '../../src/hooks/useStreakForUser';
import { useCurrentUserId } from '../../src/hooks/useCurrentUserId';

import OtherUserProfileHeader from '../../components/other-user-profile/OtherUserProfileHeader';
import OtherUserProfileInfo from '../../components/other-user-profile/OtherUserProfileInfo';
import OtherUserFollowButton from '../../components/other-user-profile/OtherUserFollowButton';
import OtherUserProfileStatsRow from '../../components/other-user-profile/OtherUserProfileStatsRow';
import OtherUserFollowersModal from '../../components/other-user-profile/OtherUserFollowersModal';
import OtherUserFollowingModal from '../../components/other-user-profile/OtherUserFollowingModal';
import OtherUserProfileTabBar, { type OtherUserTab } from '../../components/other-user-profile/OtherUserProfileTabBar';
import OtherUserFitPicsSubtab from '../../components/other-user-profile/OtherUserFitPicsSubtab';
import OtherUserClosetSubtab from '../../components/other-user-profile/OtherUserClosetSubtab';

export default function OtherUserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { userId: currentUserId } = useCurrentUserId();

  const { data, loading, error, refetch, setIsFollowing } = useOtherUserProfileData(userId);
  const { currentStreak, hasPostedToday } = useStreakForUser(userId);

  const [activeTab, setActiveTab] = useState<OtherUserTab>('fitpics');
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const isFirstFocus = useRef(true);

  const isSelf = !!userId && !!currentUserId && userId === currentUserId;

  // Refresh counts/follow status when returning from other screens,
  // mirroring the skip-first-focus pattern on account.tsx.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      if (userId) void refetch();
    }, [userId, refetch])
  );

  if (!userId) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
        <Text style={{ fontSize: 16, color: '#11181C', marginBottom: 16 }}>User not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#11181C', textDecorationLine: 'underline' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: '#11181C' }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    const isNotFound = error instanceof Error && error.message.includes('not found');
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
        <Text style={{ fontSize: 16, color: '#11181C', marginBottom: 16, textAlign: 'center' }}>
          {isNotFound ? 'This user could not be found.' : "Couldn't load profile."}
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {!isNotFound && (
            <TouchableOpacity onPress={() => void refetch()}>
              <Text style={{ color: '#11181C', textDecorationLine: 'underline' }}>Try again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: '#11181C', textDecorationLine: 'underline' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { me, counts, isFollowing } = data;
  const bio = me?.bio?.trim();

  const handleFollowChange = (nowFollowing: boolean) => {
    setIsFollowing(nowFollowing);
    // Refresh counts so follower number stays accurate.
    void refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <OtherUserProfileHeader
        username={me?.username}
        currentStreak={currentStreak}
        hasPostedToday={hasPostedToday}
      />

      {/*
        Keep profile chrome and tab bar in a non-scrolling header stack; put the tab body in flex:1 below.
        MasonryGrid uses its own ScrollView — nesting that inside a profile ScrollView breaks height,
        pull-to-refresh, and onEndReached (Phase 2 / account TabContent pattern).
      */}
      <View style={{ flex: 1 }}>
        <View style={{ flexShrink: 0, paddingBottom: 8 }}>
          <OtherUserProfileInfo avatarUrl={me?.avatarUrl} displayName={me?.displayName ?? me?.name} />

          {isSelf ? (
            <View style={{ marginHorizontal: 16, marginTop: 14, paddingVertical: 11, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#9CA3AF' }}>This is you</Text>
            </View>
          ) : (
            <OtherUserFollowButton
              userId={userId}
              isFollowing={isFollowing}
              onFollowChange={handleFollowChange}
            />
          )}

          {!!bio && (
            <Text
              style={{ fontSize: 14, color: '#666A70', paddingHorizontal: 16, marginTop: 12, lineHeight: 20 }}
              numberOfLines={6}
              ellipsizeMode="tail"
            >
              {bio}
            </Text>
          )}

          <OtherUserProfileStatsRow
            counts={counts}
            onFollowingPress={() => {
              setFollowingModalVisible(true);
              setFollowersModalVisible(false);
            }}
            onFollowersPress={() => {
              setFollowersModalVisible(true);
              setFollowingModalVisible(false);
            }}
          />

          <OtherUserProfileTabBar activeTab={activeTab} onChange={setActiveTab} />
        </View>

        <View style={{ flex: 1, minHeight: 0 }}>
          {activeTab === 'fitpics' ? (
            <OtherUserFitPicsSubtab userId={userId} />
          ) : (
            <OtherUserClosetSubtab
              userId={userId}
              initialCloset={(me as { closet?: unknown })?.closet}
              onRetry={() => {
                void refetch();
              }}
            />
          )}
        </View>
      </View>

      <OtherUserFollowersModal
        visible={followersModalVisible}
        onClose={() => setFollowersModalVisible(false)}
        userId={userId}
        onFollowChange={() => {
          void refetch();
        }}
      />
      <OtherUserFollowingModal
        visible={followingModalVisible}
        onClose={() => setFollowingModalVisible(false)}
        userId={userId}
        onFollowChange={() => {
          void refetch();
        }}
      />
    </SafeAreaView>
  );
}
