import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  username?: string;
  currentStreak: number;
  hasPostedToday: boolean;
};

export default function OtherUserProfileHeader({ username, currentStreak, hasPostedToday }: Props) {
  const router = useRouter();
  const streakActive = currentStreak > 0 && hasPostedToday;
  const displayUsername = username ? `@${username}` : '';

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/account');
    }
  };

  const handleMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report', 'Block'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1 || buttonIndex === 2) {
            Alert.alert('Coming soon', 'This feature is not yet available.');
          }
        }
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Report', onPress: () => Alert.alert('Coming soon', 'This feature is not yet available.') },
        { text: 'Block', style: 'destructive', onPress: () => Alert.alert('Coming soon', 'This feature is not yet available.') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
      }}
    >
      <TouchableOpacity
        onPress={handleBack}
        style={{ padding: 8 }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back-outline" size={26} color="#11181C" />
      </TouchableOpacity>

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Text
          style={{ fontSize: 18, fontWeight: '600', color: '#11181C' }}
          numberOfLines={1}
        >
          {displayUsername}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Ionicons
            name={streakActive ? 'flame' : 'flame-outline'}
            size={18}
            color={streakActive ? '#FF6B35' : '#9CA3AF'}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: streakActive ? '#FF6B35' : '#9CA3AF',
            }}
          >
            {currentStreak}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleMenu}
        style={{ padding: 8 }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="More options"
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="#11181C" />
      </TouchableOpacity>
    </View>
  );
}
