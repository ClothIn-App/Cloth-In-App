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
import type { FollowingUser } from "../../src/types/account";
import usersData from "../../src/mocks/mock-users.json";
import session from "../../src/mocks/mock-session.json";

type Props = {
  visible: boolean;
  onClose: () => void;
  userId?: string;
};

export default function FollowingModal({ visible, onClose, userId }: Props) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const backgroundColor = '#FFFFFF';
  const textColor = '#11181C';
  const borderColor = '#E3E3E7';
  const mutedTextColor = '#666A70';

  useEffect(() => {
    if (visible && userId) {
      loadFollowing();
    }
  }, [visible, userId]);

  const loadFollowing = async () => {
    setLoading(true);
    try {
      const users = usersData as Record<string, any>;
      
      // Load the profile user
      const profileUser = users[userId!];
      if (!profileUser) {
        setFollowing([]);
        return;
      }
      
      // Get current user ID for follow status
      const currentUserId = session.currentUserId;
      const currentUser = users[currentUserId];
      const currentUserFollowingIds = new Set(
        currentUser?.following?.userIds ?? []
      );

      // Build list from profileUser.following.userIds
      const followingIds = profileUser.following?.userIds ?? [];
      const hydratedFollowing: FollowingUser[] = followingIds
        .map((followingId: string): FollowingUser | null => {
          const user = users[followingId];
          if (!user) return null;
          
          return {
            uid: user.id,
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            isFollowing: currentUserFollowingIds.has(user.id),
            isPrivateAccount: !!user?.privacy?.isPrivateAccount,
          } as FollowingUser;
        })
        .filter((item: FollowingUser | null): item is FollowingUser => item !== null);

      setFollowing(hydratedFollowing);
    } catch (error) {
      console.error("Error loading following:", error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = (targetUserId: string, e: any) => {
    e.stopPropagation();
    setFollowing(prev => 
      prev.map(user => 
        user.uid === targetUserId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
  };

  const handleUserPress = (userId: string) => {
    router.push({
      pathname: '/user-profile',
      params: { userId },
    });
  };

  const renderFollowing = ({ item }: { item: FollowingUser }) => {
    const shouldShowDisplayName = !!item.isFollowing || !item.isPrivateAccount;
    return (
      <TouchableOpacity 
        style={[styles.followingItem, { borderBottomColor: borderColor }]}
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
            styles.unfollowButton,
            { 
              backgroundColor: item.isFollowing ? borderColor : textColor,
              borderColor: borderColor 
            }
          ]}
          onPress={(e) => handleFollowToggle(item.uid, e)}
        >
          <Text style={[
            styles.unfollowButtonText,
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
          <Text style={[styles.title, { color: textColor }]}>Following</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: mutedTextColor }}>
              Loading following...
            </Text>
          </View>
        ) : following.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: textColor }]}>Not following anyone</Text>
            <Text style={[styles.emptySubtitle, { color: mutedTextColor }]}>
              When you follow people, they'll appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={following}
            keyExtractor={(item) => item.uid}
            renderItem={renderFollowing}
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
  followingItem: {
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
