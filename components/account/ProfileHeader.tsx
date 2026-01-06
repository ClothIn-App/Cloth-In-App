import React, { useState } from "react";
import { Image, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "../../hooks/useThemeColor";
import type { ProfileMe } from "../../src/types/account";
import { ThemedText } from "../ThemedText";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import { Ionicons } from "@expo/vector-icons";

type Props = { me?: ProfileMe };

export default function ProfileHeader({ me }: Props) {
  const router = useRouter();
  const muted = useThemeColor({}, "mutedText");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const name = me?.username ? `@${me.username}` : "@username";
  const displayName = me?.displayName ?? "";
  const fitpics = (me as any)?.fitpics?.total ?? 0;
  const following = (me as any)?.following?.total ?? 0;
  const followers = (me as any)?.followers?.total ?? 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      {/* My Profile Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <ThemedText type="title" style={{ fontSize: 20, fontWeight: "600" }}>
          My Profile
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity 
            onPress={() => router.push("../profile-edit")}
            style={{ padding: 8 }}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push("../user-settings")}
            style={{ padding: 8 }}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={24} color="#000" />
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
          <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>{name}</ThemedText>
          {!!displayName && (
            <ThemedText style={{ fontSize: 14, marginTop: 2 }}>
              {displayName}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
        <ThemedText style={{ fontSize: 14 }}>FitPics {fitpics}</ThemedText>
        <TouchableOpacity onPress={() => setShowFollowingModal(true)}>
          <ThemedText style={{ fontSize: 14 }}>Following {following}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowFollowersModal(true)}>
          <ThemedText style={{ fontSize: 14 }}>Followers {followers}</ThemedText>
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
