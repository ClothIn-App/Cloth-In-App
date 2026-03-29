import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../common/UserAvatar';

type Props = {
  avatarUrl?: string | null;
  uploading: boolean;
  onPress: () => void;
};

/**
 * Shows the current avatar (or placeholder) with an edit-pencil badge.
 * While `uploading` is true an opaque spinner overlay replaces the image
 * and taps are blocked.
 */
export default function AvatarPickerRow({ avatarUrl, uploading, onPress }: Props) {
  const SIZE = 96;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        disabled={uploading}
        activeOpacity={0.75}
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
      >
        <UserAvatar avatarUrl={avatarUrl} size={SIZE} />

        {/* Edit badge — hidden while uploading */}
        {!uploading && (
          <View style={[styles.badge, { width: 28, height: 28, borderRadius: 14 }]}>
            <Ionicons name="camera" size={15} color="#fff" />
          </View>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <View style={[styles.overlay, { width: SIZE, height: SIZE, borderRadius: SIZE / 2 }]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#11181C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
