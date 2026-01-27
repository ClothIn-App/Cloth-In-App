import React, { useState, useMemo } from "react";
import { Image, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ProfileMe } from "../../src/types/account";
import FollowersModal from "./FollowersModal";
import FollowingModal from "./FollowingModal";
import usersData from "../../src/mocks/mock-users.json";
import session from "../../src/mocks/mock-session.json";

type Props = { 
  user?: ProfileMe | any;
  userId: string;
  isPrivate: boolean;
  isFollowing: boolean;
  currentUserId: string;
  onFollowStatusChange?: () => void;
};

export default function PublicProfileHeader({ user, userId, isPrivate, isFollowing, currentUserId, onFollowStatusChange }: Props) {
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [localIsFollowing, setLocalIsFollowing] = useState(isFollowing);
  const [localFollowersCount, setLocalFollowersCount] = useState(0);

  // Get user data from mock
  const profileUser = useMemo(() => {
    return (usersData as Record<string, any>)[userId];
  }, [userId]);

  const currentUser = useMemo(() => {
    return (usersData as Record<string, any>)[currentUserId];
  }, [currentUserId]);

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalIsFollowing(isFollowing);
    setLocalFollowersCount(profileUser?.followers?.total ?? 0);
  }, [isFollowing, profileUser?.followers?.total]);

  const username = user?.username || profileUser?.username || "username";
  const displayName = user?.displayName || profileUser?.displayName;
  
  // Display name visibility: show if following OR account is public
  const shouldShowDisplayName = localIsFollowing || !isPrivate;
  
  const fitpics = profileUser?.fitpics?.total ?? 0;
  const following = profileUser?.following?.total ?? 0;
  const followers = localFollowersCount || (profileUser?.followers?.total ?? 0);

  const handleFollowToggle = () => {
    // Optimistic update
    const newFollowingState = !localIsFollowing;
    setLocalIsFollowing(newFollowingState);

    // Update followers count optimistically
    if (newFollowingState) {
      setLocalFollowersCount(prev => prev + 1);
    } else {
      setLocalFollowersCount(prev => Math.max(0, prev - 1));
    }

    // Update mock data (in a real app, this would be an API call)
    if (currentUser && profileUser) {
      const followingIds = currentUser.following?.userIds || [];
      
      if (newFollowingState) {
        // Add to following list
        if (!followingIds.includes(userId)) {
          currentUser.following = {
            ...currentUser.following,
            userIds: [...followingIds, userId],
            total: (currentUser.following?.total || 0) + 1,
          };
          
          // Add current user to profile user's followers
          const profileFollowers = profileUser.followers?.userIds || [];
          if (!profileFollowers.includes(currentUserId)) {
            profileUser.followers = {
              ...profileUser.followers,
              userIds: [...profileFollowers, currentUserId],
              total: (profileUser.followers?.total || 0) + 1,
            };
          }
        }
      } else {
        // Remove from following list
        currentUser.following = {
          ...currentUser.following,
          userIds: followingIds.filter((id: string) => id !== userId),
          total: Math.max(0, (currentUser.following?.total || 0) - 1),
        };
        
        // Remove current user from profile user's followers
        const profileFollowers = profileUser.followers?.userIds || [];
        profileUser.followers = {
          ...profileUser.followers,
          userIds: profileFollowers.filter((id: string) => id !== currentUserId),
          total: Math.max(0, (profileUser.followers?.total || 0) - 1),
        };
      }
    }

    // Notify parent to refresh
    if (onFollowStatusChange) {
      // Small delay to ensure mock data is updated
      setTimeout(() => {
        onFollowStatusChange();
      }, 100);
    }
  };

  const getFollowButtonText = () => {
    if (localIsFollowing) {
      return "Following";
    }
    return isPrivate ? "Request to Follow" : "Follow";
  };

  const getFollowButtonStyle = () => {
    if (localIsFollowing) {
      return {
        backgroundColor: '#E3E3E7',
        borderColor: '#E3E3E7',
      };
    }
    return {
      backgroundColor: '#11181C',
      borderColor: '#11181C',
    };
  };

  const getFollowButtonTextStyle = () => {
    if (localIsFollowing) {
      return { color: '#11181C' };
    }
    return { color: '#FFFFFF' };
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button and Options */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back-sharp" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          onPress={() => {
            // TODO: Open options menu
          }}
          style={styles.optionsButton}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: user?.avatarUrl || profileUser?.avatarUrl || "https://placehold.co/80x80" }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{username}</Text>
          {shouldShowDisplayName && !!displayName && (
            <Text style={styles.displayName}>{displayName}</Text>
          )}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>FitPics {fitpics}</Text>
        <TouchableOpacity onPress={() => setShowFollowingModal(true)}>
          <Text style={styles.statText}>Following {following}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowFollowersModal(true)}>
          <Text style={styles.statText}>Followers {followers}</Text>
        </TouchableOpacity>
      </View>

      {/* Follow Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleFollowToggle}
          style={[styles.followButton, getFollowButtonStyle()]}
          activeOpacity={0.8}
        >
          <Text style={[styles.followButtonText, getFollowButtonTextStyle()]}>
            {getFollowButtonText()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <FollowersModal
        visible={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userId}
      />
      <FollowingModal
        visible={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        userId={userId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  optionsButton: {
    padding: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: '#11181C',
  },
  displayName: {
    fontSize: 14,
    marginTop: 2,
    color: '#11181C',
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
    color: '#11181C',
  },
  buttonContainer: {
    marginBottom: 8,
  },
  followButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
