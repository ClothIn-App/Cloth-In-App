import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { userApiClient } from '../../src/services/apiClients/userClient';

type Props = {
  userId: string;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
};

export default function OtherUserFollowButton({ userId, isFollowing, onFollowChange }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await userApiClient.unfollowUser(userId);
        onFollowChange(false);
      } else {
        await userApiClient.followUser(userId);
        onFollowChange(true);
      }
    } catch (e) {
      const message = e instanceof Error && e.message ? e.message : "Couldn't update follow status. Please try again.";
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => void handlePress()}
      disabled={loading}
      style={{
        marginHorizontal: 16,
        marginTop: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: isFollowing ? '#E3E3E7' : '#11181C',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? 'Unfollow user' : 'Follow user'}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? '#11181C' : '#FFFFFF'} />
      ) : (
        <Text style={{ fontSize: 15, fontWeight: '600', color: isFollowing ? '#11181C' : '#FFFFFF' }}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}
