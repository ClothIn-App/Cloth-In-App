import React, { useState } from "react";
import { Image, View, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import type { ProfileMe, ProfileCounts } from "../../src/types/account";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  me?: ProfileMe;
  counts?: ProfileCounts;
  currentStreak?: number;
  hasPostedToday?: boolean;
};

export default function ProfileHeader({ me, counts, currentStreak = 0, hasPostedToday = false }: Props) {
  const router = useRouter();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const name = me?.username ? `@${me.username}` : "@username";
  const displayName = me?.displayName ?? "";
  const fitpics = counts?.posts ?? (me as any)?.counts?.posts ?? 0;
  const following = counts?.following ?? (me as any)?.counts?.following ?? 0;
  const followers = counts?.followers ?? (me as any)?.counts?.followers ?? 0;
  const streakActive = currentStreak > 0 && hasPostedToday;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      {/* Header: username + streak (left) | Edit + Settings (right) */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: '#11181C' }}>{name}</Text>
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
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push("../profile-edit")}
            style={{ padding: 8 }}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={24} color="#11181C" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("../user-settings")}
            style={{ padding: 8 }}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + display name */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={{ uri: me?.avatarUrl || "https://placehold.co/80x80" }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            marginRight: 12,
            backgroundColor: "#ccc",
          }}
        />
        {!!displayName && (
          <Text style={{ fontSize: 16, fontWeight: "600", color: '#11181C' }}>
            {displayName}
          </Text>
        )}
      </View>

      {!!me?.bio && (
        <Text style={{ fontSize: 14, color: '#666A70', marginTop: 8 }}>
          {me.bio}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 16, marginTop: 8, alignItems: "center" }}>
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
        userId={(me as any)?.id ?? me?.uid}
      />
      <FollowingModal
        visible={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={(me as any)?.id ?? me?.uid}
      />
    </View>
  );
}
