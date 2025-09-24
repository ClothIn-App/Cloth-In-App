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

type Props = {
  visible: boolean;
  onClose: () => void;
  userId?: string;
};

// Mock data for now - replace with actual API call
const mockFollowers: FollowerUser[] = [
  {
    uid: "u_1",
    displayName: "Alice Johnson",
    username: "alice_j",
    avatarUrl: "https://placehold.co/60x60",
    bio: "Fashion enthusiast",
    isFollowing: false,
  },
  {
    uid: "u_2", 
    displayName: "Bob Smith",
    username: "bobsmith",
    avatarUrl: "https://placehold.co/60x60",
    bio: "Style blogger",
    isFollowing: true,
  },
  {
    uid: "u_3",
    displayName: "Carol Davis", 
    username: "carol_d",
    avatarUrl: "https://placehold.co/60x60",
    bio: "Fashion designer",
    isFollowing: false,
  },
];

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
    // Simulate API call
    setTimeout(() => {
      setFollowers(mockFollowers);
      setLoading(false);
    }, 500);
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

  const renderFollower = ({ item }: { item: FollowerUser }) => (
    <View style={[styles.followerItem, { borderBottomColor: borderColor }]}>
      <Image
        source={{ uri: item.avatarUrl || "https://placehold.co/60x60" }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>
          {item.displayName || item.username}
        </ThemedText>
        <ThemedText style={[styles.username, { color: mutedTextColor }]}>
          @{item.username}
        </ThemedText>
        {item.bio && (
          <ThemedText style={[styles.bio, { color: mutedTextColor }]}>
            {item.bio}
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
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    marginBottom: 2,
  },
  bio: {
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
});
