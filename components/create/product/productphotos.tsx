// src/create/product/productphotos.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Modal, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAddProductContext } from './addproductcontext';
import { MockDraftsProvider } from './mockdrafts';
import PhotoGrid from '../post/photogrid';

const MAX_PHOTOS = 5;

export default function ProductPhotos() {
  const { photos, setPhotos } = useAddProductContext();
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const handleAddPhotos = () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Maximum photos reached',
        `You can add up to ${MAX_PHOTOS} photos. Remove one to add another.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setShowPhotoOptions(true);
  };

  const takePhoto = () => {
    setShowPhotoOptions(false);
    ImagePicker.requestCameraPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your camera to take a product photo.',
          [{ text: 'OK' }]
        );
        return;
      }
      ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      }).then((result) => {
        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setPhotos((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
        }
      }).catch(() => {
        Alert.alert('Error', 'Failed to take photo. Please try again.', [{ text: 'OK' }]);
      });
    });
  };

  const chooseFromLibrary = () => {
    setShowPhotoOptions(false);
    ImagePicker.requestMediaLibraryPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to choose a product photo.',
          [{ text: 'OK' }]
        );
        return;
      }
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      }).then((result) => {
        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setPhotos((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
        }
      }).catch(() => {
        Alert.alert('Error', 'Failed to select photo. Please try again.', [{ text: 'OK' }]);
      });
    });
  };

  const dismissPhotoOptions = () => {
    setShowPhotoOptions(false);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((photoId) => photoId !== id));
  };

  const handleReorderPhotos = (reorderedIds: string[]) => {
    setPhotos(reorderedIds);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photos *</Text>
      <Text style={styles.subLabel}>Add 1-5 photos of your product</Text>

      <View style={styles.photoGridContainer}>
        <MockDraftsProvider>
          <PhotoGrid
            selectedIds={photos}
            onAddPress={handleAddPhotos}
            removeSelected={handleRemovePhoto}
            setSelectedOrder={handleReorderPhotos}
          />
        </MockDraftsProvider>
      </View>

      <Modal
        visible={showPhotoOptions}
        transparent
        animationType="fade"
        onRequestClose={dismissPhotoOptions}
      >
        <Pressable style={styles.photoOptionsOverlay} onPress={dismissPhotoOptions}>
          <Pressable style={styles.photoOptionsCard} onPress={() => {}}>
            <Pressable style={styles.photoOptionButton} onPress={takePhoto}>
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </Pressable>
            <Pressable style={[styles.photoOptionButton, styles.photoOptionButtonBorder]} onPress={chooseFromLibrary}>
              <Text style={styles.photoOptionText}>Choose From Library</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  photoGridContainer: {
    minHeight: 200,
  },
  photoOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  photoOptionsCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoOptionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  photoOptionButtonBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
