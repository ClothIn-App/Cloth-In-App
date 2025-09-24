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
import type { FollowingUser } from "../../src/types/account";

type Props = {
  visible: boolean;
  onClose: () => void;
  userId?: string;
};

// Mock data for now - replace with actual API call
const mockFollowing: FollowingUser[] = [
  {
    uid: "u_4",
    displayName: "Emma Wilson",
    username: "emma_w",
    avatarUrl: "https://placehold.co/60x60",
    bio: "Fashion influencer",
    isFollowing: true,
  },
  {
    uid: "u_5", 
    displayName: "David Brown",
    username: "davidb",
    avatarUrl: "https://placehold.co/60x60",
    bio: "Style consultant",
    isFollowing: true,
  },
  {
    uid: "u_6",
    displayName: "Sarah Miller", 
    username: "sarah_m",
    avatarUrl: "https://placehold.co/60x60",
    bio: "Fashion photographer",
    isFollowing: true,
  },
];

export default function FollowingModal({ visible, onClose, userId }: Props) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const mutedTextColor = useThemeColor({}, "mutedText");

  useEffect(() => {
    if (visible && userId) {
      loadFollowing();
    }
  }, [visible, userId]);

  const loadFollowing = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setFollowing(mockFollowing);
      setLoading(false);
    }, 500);
  };

  const handleUnfollow = (followingId: string) => {
    setFollowing(prev => 
      prev.map(user => 
        user.uid === followingId 
          ? { ...user, isFollowing: false }
          : user
      )
    );
  };

  const renderFollowing = ({ item }: { item: FollowingUser }) => (
    <View style={[styles.followingItem, { borderBottomColor: borderColor }]}>
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
          styles.unfollowButton,
          { 
            backgroundColor: backgroundColor,
            borderColor: borderColor 
          }
        ]}
        onPress={() => handleUnfollow(item.uid)}
      >
        <Text style={[
          styles.unfollowButtonText,
          { color: textColor }
        ]}>
          Following
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
          <ThemedText style={styles.title}>Following</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator />
            <ThemedText style={{ marginTop: 8, color: mutedTextColor }}>
              Loading following...
            </ThemedText>
          </View>
        ) : following.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>Not following anyone</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: mutedTextColor }]}>
              When you follow people, they'll appear here.
            </ThemedText>
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
});
