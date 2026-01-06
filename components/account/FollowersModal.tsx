import React, { useState, useEffect } from "react";
import { 
  Modal, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  StyleSheet 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ThemedText } from "../ThemedText";
import type { FollowerUser } from "../../src/types/account";
import usersData from "../../src/mocks/mock-users.json";
import session from "../../src/mocks/mock-session.json";

type Props = {
  visible: boolean;
  onClose: () => void;
  userId?: string;
};

export default function FollowersModal({ visible, onClose, userId }: Props) {
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");

  useEffect(() => {
    if (visible && userId) {
      loadFollowers();
    }
  }, [visible, userId]);

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const users = usersData as Record<string, any>;
      
      // Load the profile user
      const profileUser = users[userId!];
      if (!profileUser) {
        setFollowers([]);
        return;
      }
      
      // Get current user ID for follow status
      const currentUserId = session.currentUserId;
      const currentUser = users[currentUserId];
      const currentUserFollowingIds = new Set(
        currentUser?.following?.userIds ?? []
      );

      // Build list from profileUser.followers.userIds
      const followerIds = profileUser.followers?.userIds ?? [];
      const hydratedFollowers: FollowerUser[] = followerIds
        .map((followerId: string): FollowerUser | null => {
          const user = users[followerId];
          if (!user) return null;
          
          return {
            uid: user.id,
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            isFollowing: currentUserFollowingIds.has(user.id),
            isPrivateAccount: !!user?.privacy?.isPrivateAccount,
          } as FollowerUser;
        })
        .filter((item: FollowerUser | null): item is FollowerUser => item !== null);

      setFollowers(hydratedFollowers);
    } catch (error) {
      console.error("Error loading followers:", error);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = (followerId: string) => {
    setFollowers(prev => 
      prev.map(follower => 
        follower.uid === followerId 
          ? { ...follower, isFollowing: !follower.isFollowing }
          : follower
      )
    );
  };

  const renderFollower = ({ item }: { item: FollowerUser }) => {
    const shouldShowDisplayName = !!item.isFollowing || !item.isPrivateAccount;
    return (
      <View style={[styles.followerItem, { borderBottomColor: borderColor }]}>
        <Image
          source={{ uri: item.avatarUrl || "https://placehold.co/60x60" }}
          style={styles.avatar}
        />
        <View style={[styles.userInfo, !shouldShowDisplayName && styles.centerVertically]}>
          <ThemedText style={styles.username}>
            @{item.username}
          </ThemedText>
          {shouldShowDisplayName && !!item.displayName && (
            <ThemedText style={[styles.displayName, { color: mutedTextColor }]}>
              {item.displayName}
            </ThemedText>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            { 
              backgroundColor: item.isFollowing ? borderColor : textColor,
              borderColor: borderColor 
            }
          ]}
          onPress={() => handleFollowToggle(item.uid)}
        >
          <Text style={[
            styles.followButtonText,
            { 
              color: item.isFollowing ? textColor : backgroundColor 
            }
          ]}>
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
          <ThemedText style={styles.title}>Followers</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
            <ThemedText style={{ marginTop: 8, color: mutedTextColor }}>
              Loading followers...
            </ThemedText>
          </View>
        ) : followers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>No followers yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: mutedTextColor }]}>
              When people follow you, they'll appear here.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={followers}
            keyExtractor={(item) => item.uid}
            renderItem={renderFollower}
            style={styles.list}
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
  followerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#ccc",
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
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centerVertically: {
    justifyContent: "center",
  },
});
