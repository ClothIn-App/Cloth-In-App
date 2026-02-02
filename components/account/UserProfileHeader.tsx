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
  userId: string;
};

export default function UserProfileHeader({ me, counts, userId }: Props) {
  const router = useRouter();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const username = me?.username ? `@${me.username}` : "@username";
  const showDisplayName =
    !!me?.displayName &&
    (me?.isPrivateAccount === false || me?.isFollowing === true);
  const displayName = showDisplayName ? me.displayName : "";
  const following = counts?.following ?? (me as any)?.counts?.following ?? 0;
  const followers = counts?.followers ?? (me as any)?.counts?.followers ?? 0;
  const meUid = (me as any)?.id ?? me?.uid ?? userId;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      {/* Top row: back | center title | three-dot */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8 }}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: "#11181C" }}
            numberOfLines={1}
          >
            {username}
          </Text>
          {!!displayName && (
            <Text
              style={{ fontSize: 14, marginTop: 2, color: "#11181C" }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={{ padding: 8 }}
          hitSlop={8}
          onPress={() => {}}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {/* Avatar + name block (mirror ProfileHeader) */}
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
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#11181C" }}>
            {username}
          </Text>
          {!!displayName && (
            <Text style={{ fontSize: 14, marginTop: 2, color: "#11181C" }}>
              {displayName}
            </Text>
          )}
        </View>
      </View>

      {/* Counts row */}
      <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
        <TouchableOpacity onPress={() => setShowFollowersModal(true)}>
          <Text style={{ fontSize: 14, color: "#11181C" }}>
            Followers {followers}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowFollowingModal(true)}>
          <Text style={{ fontSize: 14, color: "#11181C" }}>
            Following {following}
          </Text>
        </TouchableOpacity>
      </View>

      <FollowersModal
        visible={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={meUid}
      />
      <FollowingModal
        visible={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={meUid}
      />
    </View>
  );
}
