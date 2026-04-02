// src/create/product/productphotos.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, ActionSheetIOS, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAddProductContext } from './addproductcontext';
import { DraftsProvider } from '../draftcontext';
import PhotoGrid from '../post/photogrid';

const MAX_PHOTOS = 5;

export default function ProductPhotos() {
  const { photos, setPhotos } = useAddProductContext();
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);

  // Pre-request permissions on mount so "Take photo" / "Choose from library" open immediately when tapped
  useEffect(() => {
    ImagePicker.requestCameraPermissionsAsync().catch(() => {});
    ImagePicker.requestMediaLibraryPermissionsAsync().catch(() => {});
  }, []);

  const handleAddPhotos = () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Maximum photos reached',
        `You can add up to ${MAX_PHOTOS} photos. Remove one to add another.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const takePhoto = () => {
      setIsOpeningPicker(true);
      ImagePicker.requestCameraPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          setIsOpeningPicker(false);
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
          setIsOpeningPicker(false);
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setPhotos((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
          }
        }).catch(() => {
          setIsOpeningPicker(false);
          Alert.alert('Error', 'Failed to take photo. Please try again.', [{ text: 'OK' }]);
        });
      }).catch(() => {
        setIsOpeningPicker(false);
      });
    };

    const chooseFromLibrary = () => {
      setIsOpeningPicker(true);
      ImagePicker.requestMediaLibraryPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          setIsOpeningPicker(false);
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
          setIsOpeningPicker(false);
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setPhotos((prev) => [...prev, uri].slice(0, MAX_PHOTOS));
          }
        }).catch(() => {
          setIsOpeningPicker(false);
          Alert.alert('Error', 'Failed to select photo. Please try again.', [{ text: 'OK' }]);
        });
      }).catch(() => {
        setIsOpeningPicker(false);
      });
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take photo', 'Choose from library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          else if (buttonIndex === 2) chooseFromLibrary();
        }
      );
    } else {
      Alert.alert('Add photo', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take photo', onPress: takePhoto },
        { text: 'Choose from library', onPress: chooseFromLibrary },
      ]);
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter((photoId) => photoId !== id));
  };

  const handleReorderPhotos = (reorderedIds: string[]) => {
    setPhotos(reorderedIds);
  };

  return (
    <View style={styles.container}>
      <Modal visible={isOpeningPicker} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </Modal>
      <Text style={styles.label}>Photos *</Text>
      <Text style={styles.subLabel}>Add 1-5 photos of your product</Text>

      <View style={styles.photoGridContainer}>
        <DraftsProvider>
          <PhotoGrid
            selectedIds={photos}
            onAddPress={handleAddPhotos}
            removeSelected={handleRemovePhoto}
            setSelectedOrder={handleReorderPhotos}
          />
        </DraftsProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
});
