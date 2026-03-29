import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type AvatarPhotoModalColors = {
  text: string;
  muted: string;
  background: string;
  border: string;
  error: string;
};

type LoadingRow = 'camera' | 'library' | 'remove';

type Props = {
  visible: boolean;
  onClose: () => void;
  hasAvatar: boolean;
  colors: AvatarPhotoModalColors;
  /** Return true when upload + profile update succeeded (parent should treat as close). */
  onCamera: () => Promise<boolean>;
  onLibrary: () => Promise<boolean>;
  /** After user confirms remove; return true when removal succeeded. */
  onRemove: () => Promise<boolean>;
};

const ROW_MIN_HEIGHT = 52;

export default function AvatarPhotoOptionsModal({
  visible,
  onClose,
  hasAvatar,
  colors,
  onCamera,
  onLibrary,
  onRemove,
}: Props) {
  const [phase, setPhase] = useState<'main' | 'remove_confirm'>('main');
  const [loadingRow, setLoadingRow] = useState<LoadingRow | null>(null);

  useEffect(() => {
    if (visible) {
      setPhase('main');
      setLoadingRow(null);
    }
  }, [visible]);

  const busy = loadingRow !== null;

  const runCamera = async () => {
    setLoadingRow('camera');
    try {
      const success = await onCamera();
      if (success) onClose();
    } finally {
      setLoadingRow(null);
    }
  };

  const runLibrary = async () => {
    setLoadingRow('library');
    try {
      const success = await onLibrary();
      if (success) onClose();
    } finally {
      setLoadingRow(null);
    }
  };

  const runRemove = async () => {
    setLoadingRow('remove');
    try {
      const success = await onRemove();
      if (success) onClose();
    } finally {
      setLoadingRow(null);
    }
  };

  const handleBackdrop = () => {
    if (busy) return;
    onClose();
  };

  const OptionRow = ({
    rowKey,
    label,
    onPress,
    destructive,
  }: {
    rowKey: LoadingRow;
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }) => {
    const loading = loadingRow === rowKey;
    return (
      <Pressable
        onPress={onPress}
        disabled={busy && !loading}
        style={({ pressed }) => [
          styles.optionRow,
          { minHeight: ROW_MIN_HEIGHT, borderBottomColor: colors.border },
          pressed && !busy && styles.optionPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: busy && !loading }}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text
            style={[
              styles.optionLabel,
              { color: destructive ? colors.error : colors.text },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleBackdrop}
        disabled={busy}
        accessibilityLabel="Dismiss"
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']} style={styles.safe}>
            {phase === 'main' ? (
              <>
                <Text style={[styles.sheetTitle, { color: colors.muted }]}>
                  Change profile photo
                </Text>
                <OptionRow
                  rowKey="camera"
                  label="Take Photo"
                  onPress={() => void runCamera()}
                />
                <OptionRow
                  rowKey="library"
                  label="Choose from Library"
                  onPress={() => void runLibrary()}
                />
                {hasAvatar && (
                  <OptionRow
                    rowKey="remove"
                    label="Remove Photo"
                    destructive
                    onPress={() => {
                      if (busy) return;
                      setPhase('remove_confirm');
                    }}
                  />
                )}
                <Pressable
                  onPress={onClose}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.optionRow,
                    styles.cancelRow,
                    { minHeight: ROW_MIN_HEIGHT },
                    pressed && !busy && styles.optionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                >
                  <Text style={[styles.optionLabel, { color: colors.muted }]}>Cancel</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  Remove your profile picture?
                </Text>
                <Text style={[styles.confirmBody, { color: colors.muted }]}>
                  You can add a new photo anytime from edit profile.
                </Text>
                {loadingRow === 'remove' ? (
                  <View
                    style={[
                      styles.optionRow,
                      styles.spinnerRow,
                      { minHeight: ROW_MIN_HEIGHT, borderBottomColor: colors.border },
                    ]}
                  >
                    <ActivityIndicator color={colors.text} />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void runRemove()}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.optionRow,
                      { minHeight: ROW_MIN_HEIGHT, borderBottomColor: colors.border },
                      pressed && !busy && styles.optionPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ busy: false }}
                  >
                    <Text style={[styles.optionLabel, { color: colors.error }]}>Remove</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => {
                    if (busy) return;
                    setPhase('main');
                  }}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.optionRow,
                    styles.cancelRow,
                    { minHeight: ROW_MIN_HEIGHT },
                    pressed && !busy && styles.optionPressed,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionLabel, { color: colors.muted }]}>Cancel</Text>
                </Pressable>
              </>
            )}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  safe: {
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  confirmBody: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    lineHeight: 22,
  },
  optionRow: {
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  spinnerRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  optionPressed: {
    opacity: 0.65,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
});
