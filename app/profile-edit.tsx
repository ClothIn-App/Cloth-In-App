import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AvatarPicker from '../components/profile/AvatarPicker';
import { userApiClient } from '../src/services/apiClients/userClient';
import useAccountData from '../src/hooks/useAccountData';
import { useCurrentUserId } from '../src/hooks/useCurrentUserId';

type ProfileFormData = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  accountType: 'personal' | 'brand' | 'creator';
  isPrivateAccount: boolean;
};

const COLORS = {
  text: '#11181C',
  muted: '#666A70',
  background: '#FFFFFF',
  border: '#E3E3E7',
  error: '#ef4444',
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, loading: authLoading } = useCurrentUserId();

  const { data, loading: profileLoading } = useAccountData(userId);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    accountType: 'personal',
    isPrivateAccount: false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 60 + topPad;
  const bottomPad = Math.max(insets.bottom, 24);

  // Initialize form with current profile data
  useEffect(() => {
    if (data.me) {
      const me = data.me as { privacy?: { isPrivateAccount?: boolean } };
      setFormData({
        displayName: data.me.displayName || data.me.name || '',
        username: data.me.username || '',
        bio: data.me.bio || '',
        avatarUrl: data.me.avatarUrl || '',
        accountType: (data.me.accountType as 'personal' | 'brand' | 'creator') || 'personal',
        isPrivateAccount: !!me?.privacy?.isPrivateAccount,
      });
    }
  }, [data.me]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name must be 50 characters or less';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be 30 characters or less';
    } else if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, and underscores';
    }

    if (formData.bio.length > 150) {
      newErrors.bio = 'Bio must be 150 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await userApiClient.setUser(userId, {
        name: formData.displayName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim() || undefined,
        avatarUrl: formData.avatarUrl || undefined,
        accountType: formData.accountType,
        privacy: { isPrivateAccount: formData.isPrivateAccount },
      });

      if (response.user) {
        Alert.alert(
          'Profile Updated',
          'Your profile has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      if (message.toLowerCase().includes('username') && message.toLowerCase().includes('taken')) {
        setErrors((prev) => ({ ...prev, username: 'That username is already taken' }));
      }
      Alert.alert(
        'Error',
        message,
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };


  const updateField = <K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: COLORS.text }}>Unable to load profile.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.text, textDecorationLine: 'underline' }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (authLoading || profileLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={{ marginTop: 16, color: COLORS.text }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data.me) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: COLORS.text }}>Couldn't load profile.</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: COLORS.text, textDecorationLine: 'underline' }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <Ionicons name="chevron-back-sharp" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          hitSlop={8}
          style={[styles.headerSaveButton, saving && styles.headerSaveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <Text style={styles.headerSaveText}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 40 }]}
      >
        {/* Avatar Section */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <View style={styles.avatarSection}>
            <AvatarPicker
              value={formData.avatarUrl}
              onChange={(url) => updateField('avatarUrl', url)}
            />
            <Text style={[styles.avatarHint, { color: COLORS.muted }]}>
              Tap to change your profile photo
            </Text>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: errors.displayName ? COLORS.error : COLORS.border,
                  color: COLORS.text,
                },
              ]}
              value={formData.displayName}
              onChangeText={(value) => updateField('displayName', value)}
              placeholder="Enter your display name"
              placeholderTextColor={COLORS.muted}
              maxLength={50}
            />
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}
            <Text style={[styles.characterCount, { color: COLORS.muted }]}>
              {formData.displayName.length}/50
            </Text>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username *</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: errors.username ? COLORS.error : COLORS.border,
                  color: COLORS.text,
                },
              ]}
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              placeholder="Enter your username"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              maxLength={30}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
            <Text style={[styles.characterCount, { color: COLORS.muted }]}>
              {formData.username.length}/30
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                {
                  borderColor: errors.bio ? COLORS.error : COLORS.border,
                  color: COLORS.text,
                },
              ]}
              value={formData.bio}
              onChangeText={(value) => updateField('bio', value)}
              placeholder="Tell us about yourself..."
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={3}
              maxLength={150}
            />
            {errors.bio && (
              <Text style={styles.errorText}>{errors.bio}</Text>
            )}
            <Text style={[styles.characterCount, { color: COLORS.muted }]}>
              {formData.bio.length}/150
            </Text>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleLabel}>Private Account</Text>
              <Text style={[styles.toggleDescription, { color: COLORS.muted }]}>
                Only approved followers can see your FitPics, Closet, and Saved items
              </Text>
            </View>
            <Switch
              value={formData.isPrivateAccount}
              onValueChange={(value) => updateField('isPrivateAccount', value)}
              trackColor={{ false: COLORS.border, true: '#11181C' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Account Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Type</Text>
          <Text style={[styles.sectionSubtitle, { color: COLORS.muted }]}>
            This affects which tabs appear on your profile
          </Text>

          {(['personal', 'brand', 'creator'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.radioOption,
                {
                  borderColor: formData.accountType === type ? COLORS.text : COLORS.border,
                  backgroundColor:
                    formData.accountType === type ? 'rgba(17,24,28,0.06)' : COLORS.background,
                },
              ]}
              onPress={() => updateField('accountType', type)}
            >
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <Text style={[styles.radioDescription, { color: COLORS.muted }]}>
                  {type === 'personal' && 'Share your personal style and outfits'}
                  {type === 'brand' && 'Showcase your brand and products'}
                  {type === 'creator' && 'Share content and connect with followers'}
                </Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  {
                    borderColor: formData.accountType === type ? COLORS.text : COLORS.border,
                    backgroundColor:
                      formData.accountType === type ? COLORS.text : COLORS.background,
                  },
                ]}
              >
                {formData.accountType === type && (
                  <View style={[styles.radioButtonInner, { backgroundColor: COLORS.background }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#11181C',
  },
  headerSaveButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  headerSaveButtonDisabled: {
    opacity: 0.6,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  firstSection: {
    paddingHorizontal: 16,
    paddingTop: 0, // No top padding
    paddingBottom: 20,
  },
  scrollContent: {
    paddingTop: 0, // Remove default scroll padding
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#11181C',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 14,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
