import React from "react";
import { Image, View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import type { ProfileCounts, ProfileMe } from "../../src/types/account";
import { ThemedText } from "../ThemedText";

type Props = { me?: ProfileMe; counts?: ProfileCounts };

export default function ProfileHeader({ me, counts }: Props) {
  const muted = useThemeColor({}, "mutedText");

  const name = me?.displayName ?? "My Account";
  const handle = me?.username ?? "username";
  const posts = counts?.posts ?? 0;
  const following = counts?.following ?? 0;
  const followers = counts?.followers ?? 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={{ uri: me?.avatarUrl || "https://placehold.co/120x120" }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            marginRight: 16,
            backgroundColor: "#ccc",
          }}
        />
        <View>
          <ThemedText type="title">{name}</ThemedText>
          <ThemedText style={{ color: muted }}>@{handle}</ThemedText>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
        <ThemedText>Posts {posts}</ThemedText>
        <ThemedText>Following {following}</ThemedText>
        <ThemedText>Followers {followers}</ThemedText>
      </View>
    </View>
  );
}
