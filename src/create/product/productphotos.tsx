// src/create/product/productphotos.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useAddProductContext } from './addproductcontext';
import { MockDraftsProvider } from './mockdrafts';
import PhotoGrid from '../post/photogrid';
import CameraRollScreenProduct from './camerarollscreen-product';

export default function ProductPhotos() {
  const { photos, setPhotos } = useAddProductContext();
  const [showCameraRoll, setShowCameraRoll] = useState(false);

  const handleAddPhotos = () => {
    setShowCameraRoll(true);
  };

  const handlePhotosSelected = (selectedIds: string[]) => {
    setPhotos(selectedIds);
    setShowCameraRoll(false);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter(photoId => photoId !== id));
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

      <Modal visible={showCameraRoll} animationType="slide" presentationStyle="fullScreen">
        <CameraRollScreenProduct
          onClose={() => setShowCameraRoll(false)}
          onNext={handlePhotosSelected}
        />
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
});
