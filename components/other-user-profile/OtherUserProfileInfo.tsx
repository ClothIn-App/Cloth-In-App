import React from 'react';
import { View, Text } from 'react-native';
import UserAvatar from '../common/UserAvatar';

type Props = {
  avatarUrl?: string | null;
  displayName?: string;
};

export default function OtherUserProfileInfo({ avatarUrl, displayName }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 }}>
      <UserAvatar avatarUrl={avatarUrl} size={60} />
      {!!displayName && (
        <Text
          style={{ fontSize: 16, fontWeight: '600', color: '#11181C', marginLeft: 14 }}
          numberOfLines={2}
        >
          {displayName}
        </Text>
      )}
    </View>
  );
}
