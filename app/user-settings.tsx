// app/user-settings.tsx
import * as React from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function SettingsContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const handleClose = React.useCallback(() => {
    router.back();
  }, [router]);

  const handleLogout = React.useCallback(async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            // Clear all tokens using token manager
            const { clearTokens } = await import('@/src/services/authTokenManager');
            await clearTokens();
            
            // Reset navigation stack to welcome page (no back history)
            router.dismissAll();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  }, [router]);

  // Calculate header height similar to other modals
  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 60 + topPad;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
          <Ionicons name="chevron-back-sharp" size={24} color="#000000" />
        </Pressable>
        
        <Text style={styles.headerTitle}>Settings</Text>
        
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Placeholder for future settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingItemText, styles.settingItemDisabled]}>
              Notifications
            </Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingItemText, styles.settingItemDisabled]}>
              Privacy
            </Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingItemText, styles.settingItemDisabled]}>
              Help Center
            </Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={[styles.settingItemText, styles.settingItemDisabled]}>
              Contact Us
            </Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Pressable 
            style={styles.settingItem}
            onPress={() => router.push('/profile-edit')}
          >
            <Text style={styles.settingItemText}>Edit Profile</Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </Pressable>
          
          <Pressable 
            style={styles.settingItem}
            onPress={handleLogout}
          >
            <Text style={styles.settingItemText}>Log Out</Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </Pressable>
        </View>

        {/* Dev Section - only visible in development builds */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development</Text>
            
            <Pressable 
              style={styles.settingItem}
              onPress={async () => {
                Alert.alert(
                  "Clear Auth State",
                  "Clear all tokens and auth state. Useful after code pushes or when testing.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Clear",
                      style: "destructive",
                      onPress: async () => {
                        const { clearTokens } = await import('@/src/services/authTokenManager');
                        await clearTokens();
                        router.dismissAll();
                        router.replace('/auth/welcome');
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={[styles.settingItemText, { color: '#ef4444' }]}>
                🧹 Clear Auth State
              </Text>
              <Text style={styles.settingItemArrow}>›</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
  headerButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  settingItemDisabled: {
    color: '#9ca3af',
  },
  settingItemArrow: {
    fontSize: 18,
    color: '#d1d5db',
    fontWeight: '300',
  },
});

export default function SettingsScreen() {
  return <SettingsContent />;
}
