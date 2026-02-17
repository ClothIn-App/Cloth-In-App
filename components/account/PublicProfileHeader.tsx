import React, { useState } from "react";
import { Image, View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { userApiClient } from "../../src/services/apiClients/userClient";
import type { PublicProfileData } from "../../src/hooks/usePublicProfile";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";

type Props = {
  profileData: PublicProfileData;
  onFollowChange?: () => void;
  currentStreak?: number;
  hasPostedToday?: boolean;
};

export default function PublicProfileHeader({ profileData, onFollowChange, currentStreak = 0, hasPostedToday = false }: Props) {
  const router = useRouter();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(profileData.isFollowing);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  const { user, isPrivateAccount } = profileData;
  const username = user.username ? `@${user.username}` : "@username";
  const displayName = user.displayName ?? "";
  const fitpics = user.counts?.posts ?? 0;
  const following = user.counts?.following ?? 0;
  const followers = user.counts?.followers ?? 0;
  const streakActive = currentStreak > 0 && hasPostedToday;

  // Show display name (vs username) next to avatar when public OR following
  const shouldShowDisplayName = !isPrivateAccount || isFollowing;
  // Show streak only when public OR following (hide for private until followed)
  const shouldShowStreak = !isPrivateAccount || isFollowing;

  const handleFollowPress = async () => {
    if (!user.uid) return;

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        await userApiClient.unfollowUser(user.uid);
        setIsFollowing(false);
      } else {
        await userApiClient.followUser(user.uid);
        setIsFollowing(true);
      }
      onFollowChange?.();
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const getFollowButtonText = () => {
    if (isFollowing) {
      return "Following";
    }
    if (isPrivateAccount) {
      return "Request to Follow";
    }
    return "Follow";
  };

  const getFollowButtonStyle = () => {
    if (isFollowing) {
      return {
        backgroundColor: '#E3E3E7',
        borderColor: '#E3E3E7',
      };
    }
    return {
      backgroundColor: '#11181C',
      borderColor: '#11181C',
    };
  };

  const getFollowButtonTextStyle = () => {
    if (isFollowing) {
      return { color: '#11181C' };
    }
    return { color: '#FFFFFF' };
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      {/* Header Row: Back | Username + Streak | Menu */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: '#11181C' }}>
            {username}
          </Text>
          {shouldShowStreak && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Ionicons
                name={streakActive ? "flame" : "flame-outline"}
                size={18}
                color={streakActive ? "#FF6B35" : "#9CA3AF"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: streakActive ? "#FF6B35" : "#9CA3AF",
                }}
              >
                {currentStreak}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {/* Avatar + display name or username (private, not following = username only) */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Image
          source={{ uri: user.avatarUrl || "https://placehold.co/80x80" }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            marginRight: 12,
            backgroundColor: "#ccc",
          }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: '#11181C' }}>
            {shouldShowDisplayName ? (displayName || username) : username}
          </Text>
        </View>
      </View>

      {/* Follow Button */}
      <TouchableOpacity
        onPress={handleFollowPress}
        disabled={isLoadingFollow}
        style={[
          {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            minHeight: 36,
          },
          getFollowButtonStyle(),
        ]}
      >
        {isLoadingFollow ? (
          <ActivityIndicator size="small" color={isFollowing ? "#11181C" : "#FFFFFF"} />
        ) : (
          <Text style={[{ fontSize: 14, fontWeight: "600" }, getFollowButtonTextStyle()]}>
            {getFollowButtonText()}
          </Text>
        )}
      </TouchableOpacity>

      {shouldShowDisplayName && !!user.bio && (
        <Text style={{ fontSize: 14, color: '#666A70', marginTop: 8, marginBottom: 8 }}>
          {user.bio}
        </Text>
      )}

      {/* Counts Row */}
      <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
        <Text style={{ fontSize: 14, color: '#11181C' }}>FitPics {fitpics}</Text>
        <TouchableOpacity onPress={() => setShowFollowingModal(true)}>
          <Text style={{ fontSize: 14, color: '#11181C' }}>Following {following}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowFollowersModal(true)}>
          <Text style={{ fontSize: 14, color: '#11181C' }}>Followers {followers}</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <FollowersModal
        visible={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={user.uid}
      />
      <FollowingModal
        visible={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={user.uid}
      />
    </View>
  );
}
