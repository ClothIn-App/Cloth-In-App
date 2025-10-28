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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from '../components/ThemedText';
import AvatarPicker from '../components/profile/AvatarPicker';
import { userClient } from '../src/services/apiClients';
import useAccountData from '../src/hooks/useAccountData';
import type { ProfileMe } from '../src/types/account';

type ProfileFormData = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  accountType: 'personal' | 'brand' | 'creator';
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // TODO: Replace with real auth context
  const userId = "u_demo";
  
  const { data, loading: profileLoading } = useAccountData(userId);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    accountType: 'personal',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  // Initialize form with current profile data
  useEffect(() => {
    if (data.me) {
      setFormData({
        displayName: data.me.displayName || '',
        username: data.me.username || '',
        bio: data.me.bio || '',
        avatarUrl: data.me.avatarUrl || '',
        accountType: data.me.accountType || 'personal',
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
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be 20 characters or less';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (formData.bio.length > 150) {
      newErrors.bio = 'Bio must be 150 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Call mock API that mirrors backend exactly
      const response = await userClient.setUser(userId, {
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim() || null,
        avatarUrl: formData.avatarUrl || undefined,
        accountType: formData.accountType,
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
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };


  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 16 }}>Loading profile...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top', 'bottom']}>
      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.firstSection}>
          <ThemedText style={styles.sectionTitle}>Profile Photo</ThemedText>
          <View style={styles.avatarSection}>
            <AvatarPicker
              value={formData.avatarUrl}
              onChange={(url) => updateField('avatarUrl', url)}
            />
            <ThemedText style={[styles.avatarHint, { color: mutedTextColor }]}>
              Tap to change your profile photo
            </ThemedText>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          
          {/* Display Name */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Display Name *</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.displayName ? '#ef4444' : borderColor,
                  color: textColor,
                }
              ]}
              value={formData.displayName}
              onChangeText={(value) => updateField('displayName', value)}
              placeholder="Enter your display name"
              placeholderTextColor={mutedTextColor}
              maxLength={50}
            />
            {errors.displayName && (
              <ThemedText style={styles.errorText}>{errors.displayName}</ThemedText>
            )}
            <ThemedText style={[styles.characterCount, { color: mutedTextColor }]}>
              {formData.displayName.length}/50
            </ThemedText>
          </View>

          {/* Username */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Username *</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  borderColor: errors.username ? '#ef4444' : borderColor,
                  color: textColor,
                }
              ]}
              value={formData.username}
              onChangeText={(value) => updateField('username', value)}
              placeholder="Enter your username"
              placeholderTextColor={mutedTextColor}
              autoCapitalize="none"
              maxLength={20}
            />
            {errors.username && (
              <ThemedText style={styles.errorText}>{errors.username}</ThemedText>
            )}
            <ThemedText style={[styles.characterCount, { color: mutedTextColor }]}>
              {formData.username.length}/20
            </ThemedText>
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Bio</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { 
                  borderColor: errors.bio ? '#ef4444' : borderColor,
                  color: textColor,
                }
              ]}
              value={formData.bio}
              onChangeText={(value) => updateField('bio', value)}
              placeholder="Tell us about yourself..."
              placeholderTextColor={mutedTextColor}
              multiline
              numberOfLines={3}
              maxLength={150}
            />
            {errors.bio && (
              <ThemedText style={styles.errorText}>{errors.bio}</ThemedText>
            )}
            <ThemedText style={[styles.characterCount, { color: mutedTextColor }]}>
              {formData.bio.length}/150
            </ThemedText>
          </View>
        </View>

        {/* Account Type Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Type</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: mutedTextColor }]}>
            This affects which tabs appear on your profile
          </ThemedText>
          
          {(['personal', 'brand', 'creator'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.radioOption,
                { 
                  borderColor: formData.accountType === type ? textColor : borderColor,
                  backgroundColor: formData.accountType === type ? `${textColor}10` : backgroundColor,
                }
              ]}
              onPress={() => updateField('accountType', type)}
            >
              <View style={styles.radioContent}>
                <ThemedText style={styles.radioLabel}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
                <ThemedText style={[styles.radioDescription, { color: mutedTextColor }]}>
                  {type === 'personal' && 'Share your personal style and outfits'}
                  {type === 'brand' && 'Showcase your brand and products'}
                  {type === 'creator' && 'Share content and connect with followers'}
                </ThemedText>
              </View>
              <View style={[
                styles.radioButton,
                { 
                  borderColor: formData.accountType === type ? textColor : borderColor,
                  backgroundColor: formData.accountType === type ? textColor : backgroundColor,
                }
              ]}>
                {formData.accountType === type && (
                  <View style={[styles.radioButtonInner, { backgroundColor }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button at Bottom */}
        <View style={styles.bottomSection}>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, { borderColor: borderColor }]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={textColor} />
            ) : (
              <Text style={[styles.saveButtonText, { color: textColor }]}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  bottomSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40, // Extra padding for safe area
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
