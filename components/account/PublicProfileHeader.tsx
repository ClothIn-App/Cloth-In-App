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
};

export default function PublicProfileHeader({ profileData, onFollowChange }: Props) {
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

  // Show display name only if privacy allows (public OR following)
  const shouldShowDisplayName = !isPrivateAccount || isFollowing;

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
      {/* Header Row: Back button, Title, Menu */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "600", color: '#11181C' }}>
            {username}
          </Text>
        </View>
        <TouchableOpacity
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {/* Profile Info Row */}
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
          <Text style={{ fontSize: 16, fontWeight: "600", color: '#11181C' }}>{username}</Text>
          {shouldShowDisplayName && !!displayName && (
            <Text style={{ fontSize: 14, marginTop: 2, color: '#11181C' }}>
              {displayName}
            </Text>
          )}
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

      {/* Counts Row */}
      <View style={{ flexDirection: "row", gap: 16 }}>
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
