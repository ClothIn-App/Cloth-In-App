import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hasAvatarUrl } from '../../src/utils/avatarUrl';

const DEFAULT_ICON_COLOR = '#9CA3AF';

type Props = {
  avatarUrl?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  iconColor?: string;
};

export default function UserAvatar({
  avatarUrl,
  size,
  style,
  onPress,
  iconColor = DEFAULT_ICON_COLOR,
}: Props) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [avatarUrl]);

  const tryImage = hasAvatarUrl(avatarUrl) && !loadFailed;
  const radius = size / 2;

  const fallback = (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Profile picture"
    >
      <Ionicons name="person-circle-outline" size={size} color={iconColor} />
    </View>
  );

  const content = tryImage ? (
    <View style={[styles.clip, { width: size, height: size, borderRadius: radius }, style]}>
      <Image
        source={{ uri: avatarUrl!.trim() }}
        style={{ width: size, height: size, borderRadius: radius }}
        onError={() => setLoadFailed(true)}
        accessibilityRole="image"
        accessibilityLabel="Profile picture"
      />
    </View>
  ) : (
    fallback
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} disabled={false}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
