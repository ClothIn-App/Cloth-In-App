import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColor } from '../../hooks/useThemeColor';
import { ThemedText } from '../ThemedText';

type Props = {
  value?: string;
  onChange: (url: string) => void;
};

export default function AvatarPicker({ value, onChange }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library to change your profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your camera to take a profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async (source: 'library' | 'camera') => {
    setShowOptions(false);

    try {
      let result;
      
      if (source === 'library') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) return;
        
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        // In a real app, you would upload the image to a server
        // For now, we'll use the local URI as a mock URL
        const mockUrl = result.assets[0].uri;
        onChange(mockUrl);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => onChange('')
        },
      ]
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => setShowOptions(true)}
        activeOpacity={0.7}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: borderColor }]}>
            <Ionicons name="person" size={40} color={mutedTextColor} />
          </View>
        )}
        
        <View style={[styles.editButton, { backgroundColor: textColor }]}>
          <Ionicons 
            name={value ? "camera" : "add"} 
            size={16} 
            color={backgroundColor} 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <ThemedText style={styles.modalTitle}>Change Profile Photo</ThemedText>
            
            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: borderColor }]}
              onPress={() => pickImage('camera')}
            >
              <Ionicons name="camera" size={24} color={textColor} />
              <ThemedText style={styles.modalOptionText}>Take Photo</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: borderColor }]}
              onPress={() => pickImage('library')}
            >
              <Ionicons name="images" size={24} color={textColor} />
              <ThemedText style={styles.modalOptionText}>Choose from Library</ThemedText>
            </TouchableOpacity>
            
            {value && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={removeImage}
              >
                <Ionicons name="trash" size={24} color="#ef4444" />
                <Text style={[styles.modalOptionText, { color: '#ef4444' }]}>
                  Remove Photo
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.modalCancel, { borderTopColor: borderColor }]}
              onPress={() => setShowOptions(false)}
            >
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#e5e7eb', // Light gray border
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area for home indicator
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  modalCancel: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
