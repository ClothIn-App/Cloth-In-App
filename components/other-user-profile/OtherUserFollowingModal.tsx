import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { FollowingUser } from "../../src/types/account";
import { userApiClient } from "../../src/services/apiClients/userClient";
import UserAvatar from "../common/UserAvatar";
import { openUserProfile } from "../../src/navigation/openUserProfile";

type Props = {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  /** Called after successful follow/unfollow so parent can refresh counts. */
  onFollowChange?: () => void;
};

export default function OtherUserFollowingModal({
  visible,
  onClose,
  userId,
  onFollowChange,
}: Props) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const backgroundColor = "#FFFFFF";
  const textColor = "#11181C";
  const borderColor = "#E3E3E7";
  const mutedTextColor = "#666A70";

  useEffect(() => {
    if (visible && userId) {
      void loadFollowing();
    }
  }, [visible, userId]);

  const loadFollowing = async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      if (!userId) {
        setFollowing([]);
        setNextCursor(null);
        setHasMore(false);
        return;
      }

      const response = await userApiClient.getFollowing(userId, {
        limit: 20,
        cursor,
      });
      setFollowing((prev) => (cursor ? [...prev, ...response.following] : response.following));
      setNextCursor(response.pagination?.nextCursor ?? null);
      setHasMore(!!response.pagination?.hasMore);
    } catch (error) {
      console.error("Error loading following:", error);
      if (!cursor) setFollowing([]);
      if (!cursor) {
        Alert.alert("Error", "Couldn't load following list. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing?: boolean) => {
    try {
      if (isFollowing) {
        await userApiClient.unfollowUser(targetUserId);
      } else {
        await userApiClient.followUser(targetUserId);
      }
      setFollowing((prev) =>
        prev.map((user) =>
          user.uid === targetUserId ? { ...user, isFollowing: !isFollowing } : user
        )
      );
      onFollowChange?.();
    } catch (error) {
      console.error("Error updating follow state:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Couldn't update follow status. Please try again.";
      Alert.alert("Error", message);
    }
  };

  const handleUsernamePress = (followingUserId: string) => {
    openUserProfile(followingUserId);
    onClose();
  };

  const renderFollowing = ({ item }: { item: FollowingUser }) => {
    const shouldShowDisplayName = !!item.isFollowing || !item.isPrivateAccount;
    return (
      <View style={[styles.followingItem, { borderBottomColor: borderColor }]}>
        <UserAvatar
          avatarUrl={item.avatarUrl}
          size={50}
          style={styles.avatar}
          onPress={() => handleUsernamePress(item.uid)}
        />
        <View style={[styles.userInfo, !shouldShowDisplayName && styles.centerVertically]}>
          <TouchableOpacity onPress={() => handleUsernamePress(item.uid)}>
            <Text style={[styles.username, { color: textColor }]}>@{item.username}</Text>
          </TouchableOpacity>
          {shouldShowDisplayName && !!item.displayName && (
            <Text style={[styles.displayName, { color: mutedTextColor }]}>{item.displayName}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.unfollowButton,
            {
              backgroundColor: item.isFollowing ? borderColor : textColor,
              borderColor: borderColor,
            },
          ]}
          onPress={() => void handleFollowToggle(item.uid, item.isFollowing)}
        >
          <Text
            style={[
              styles.unfollowButtonText,
              {
                color: item.isFollowing ? textColor : backgroundColor,
              },
            ]}
          >
            {item.isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: textColor }]}>Done</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: textColor }]}>Following</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: mutedTextColor }}>Loading following...</Text>
          </View>
        ) : following.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: textColor }]}>Not following anyone</Text>
            <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
              Accounts they follow will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={following}
            keyExtractor={(item) => item.uid}
            renderItem={renderFollowing}
            style={styles.list}
            onEndReached={() => {
              if (hasMore && nextCursor && !loadingMore) {
                void loadFollowing(nextCursor);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 12 }}>
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  followingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  displayName: {
    fontSize: 14,
  },
  unfollowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  unfollowButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centerVertically: {
    justifyContent: "center",
  },
});
