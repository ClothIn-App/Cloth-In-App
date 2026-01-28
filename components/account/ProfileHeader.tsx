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
};

export default function ProfileHeader({ me, counts }: Props) {
  const router = useRouter();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const name = me?.username ? `@${me.username}` : "@username";
  const displayName = me?.displayName ?? "";
  const fitpics = counts?.posts ?? (me as any)?.counts?.posts ?? 0;
  const following = counts?.following ?? (me as any)?.counts?.following ?? 0;
  const followers = counts?.followers ?? (me as any)?.counts?.followers ?? 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      {/* My Profile Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: "600", color: '#11181C' }}>
          My Profile
        </Text>
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: '#11181C' }}>{name}</Text>
          {!!displayName && (
            <Text style={{ fontSize: 14, marginTop: 2, color: '#11181C' }}>
              {displayName}
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
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
