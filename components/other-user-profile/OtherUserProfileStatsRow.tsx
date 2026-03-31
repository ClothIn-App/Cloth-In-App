import React from "react";
import { View, Text, Pressable } from "react-native";
import type { ProfileCounts } from "../../src/types/account";

type Props = {
  counts?: ProfileCounts;
  onFollowingPress?: () => void;
  onFollowersPress?: () => void;
};

const statText = { fontSize: 14, fontWeight: "400" as const, color: "#11181C" };

function StatInline({ label, value }: { label: string; value: number }) {
  return (
    <Text style={statText}>
      {label} {value}
    </Text>
  );
}

export default function OtherUserProfileStatsRow({
  counts,
  onFollowingPress,
  onFollowersPress,
}: Props) {
  const following = counts?.following ?? 0;
  const followers = counts?.followers ?? 0;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        gap: 16,
      }}
    >
      <StatInline label="FitPics" value={counts?.posts ?? 0} />
      {onFollowingPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Following, ${following}`}
          onPress={onFollowingPress}
        >
          <StatInline label="Following" value={following} />
        </Pressable>
      ) : (
        <StatInline label="Following" value={following} />
      )}
      {onFollowersPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Followers, ${followers}`}
          onPress={onFollowersPress}
        >
          <StatInline label="Followers" value={followers} />
        </Pressable>
      ) : (
        <StatInline label="Followers" value={followers} />
      )}
    </View>
  );
}
