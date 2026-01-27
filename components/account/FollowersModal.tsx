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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
  
  const backgroundColor = '#FFFFFF';
  const textColor = '#11181C';
  const borderColor = '#E3E3E7';
  const mutedTextColor = '#666A70';

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

  const handleFollowToggle = (followerId: string, e: any) => {
    e.stopPropagation();
    setFollowers(prev => 
      prev.map(follower => 
        follower.uid === followerId 
          ? { ...follower, isFollowing: !follower.isFollowing }
          : follower
      )
    );
  };

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: '/user-profile',
      params: { userId },
    });
  };

  const renderFollower = ({ item }: { item: FollowerUser }) => {
    const shouldShowDisplayName = !!item.isFollowing || !item.isPrivateAccount;
    return (
      <TouchableOpacity 
        style={[styles.followerItem, { borderBottomColor: borderColor }]}
        onPress={() => handleUserPress(item.uid)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.avatarUrl || "https://placehold.co/60x60" }}
          style={styles.avatar}
        />
        <View style={[styles.userInfo, !shouldShowDisplayName && styles.centerVertically]}>
          <Text style={[styles.username, { color: textColor }]}>
            @{item.username}
          </Text>
          {shouldShowDisplayName && !!item.displayName && (
            <Text style={[styles.displayName, { color: mutedTextColor }]}>
              {item.displayName}
            </Text>
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
          onPress={(e) => handleFollowToggle(item.uid, e)}
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
      </TouchableOpacity>
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
          <Text style={[styles.title, { color: textColor }]}>Followers</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: mutedTextColor }}>
              Loading followers...
            </Text>
          </View>
        ) : followers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No followers yet</Text>
            <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
              When people follow you, they'll appear here.
            </Text>
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
