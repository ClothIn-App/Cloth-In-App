// app/notifications.tsx
import * as React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function NotificationsContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleClose = React.useCallback(() => {
    router.back();
  }, [router]);

  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 60 + topPad;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
          <Ionicons name="chevron-back-sharp" size={24} color="#000000" />
        </Pressable>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerButton} />
      </View>

      {/* Empty content area - ready for follow requests and other notifications */}
      <View style={styles.content} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
});

export default function NotificationsScreen() {
  return <NotificationsContent />;
}
