/**
 * Hook for handling FitPic posting functionality
 * Integrates with the existing create flow and API services
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDrafts } from '../create/draftcontext';
import { usePost } from '../create/post/postcontext';
import { createFitPic } from '../services/fitpicApi';
import { uploadPhotos, type PhotoUploadRequest } from '../services/photoUploadService';
import type { CreateFitPicRequest } from '../types/fitpic';

export type PostingState = {
  isPosting: boolean;
  progress: number;
  currentStep: 'uploading' | 'creating' | 'completed' | 'error';
  error?: string;
};

export const useFitPicPosting = () => {
  const router = useRouter();
  const { selectedIds, items, clear: clearDrafts } = useDrafts();
  const { meta, clearMeta } = usePost();
  
  const [postingState, setPostingState] = useState<PostingState>({
    isPosting: false,
    progress: 0,
    currentStep: 'uploading'
  });

  const handlePost = useCallback(async () => {
    if (postingState.isPosting) return;
    
    // Validate required data
    if (selectedIds.length === 0) {
      Alert.alert('No Photos', 'Please select at least one photo to post.');
      return;
    }

    if (!meta.caption.trim()) {
      Alert.alert('Caption Required', 'Please add a caption to your fit pic.');
      return;
    }

    setPostingState({
      isPosting: true,
      progress: 0,
      currentStep: 'uploading'
    });

    try {
      // Get selected photos from drafts
      const selectedPhotos = selectedIds
        .map(id => items.find(item => item.id === id))
        .filter(Boolean);

      if (selectedPhotos.length === 0) {
        throw new Error('Selected photos not found');
      }

      // Prepare photos for upload
      const photosToUpload: PhotoUploadRequest[] = selectedPhotos.map(photo => ({
        uri: photo!.uri,
        type: 'image/jpeg', // Default type, in real app this would come from the photo
        name: `fitpic_${Date.now()}_${photo!.id}.jpg`
      }));

      // Upload photos with progress tracking
      const uploadResult = await uploadPhotos(photosToUpload, (uploadId, progress) => {
        setPostingState(prev => ({
          ...prev,
          progress: Math.round(progress.progress),
          currentStep: progress.status === 'completed' ? 'creating' : 'uploading'
        }));
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.errors?.join(', ') || 'Photo upload failed');
      }

      // Prepare FitPic creation request
      const createRequest: CreateFitPicRequest = {
        photos: uploadResult.uploads
          .filter(upload => upload.success)
          .map(upload => ({
            uri: upload.url!,
            type: 'image/jpeg',
            name: `uploaded_${upload.uploadId}.jpg`
          })),
        caption: meta.caption,
        products: meta.products || [],
        isPublic: true
      };

      setPostingState(prev => ({
        ...prev,
        currentStep: 'creating',
        progress: 90
      }));

      // Create the FitPic
      const createResult = await createFitPic(createRequest);

      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create fit pic');
      }

      setPostingState(prev => ({
        ...prev,
        currentStep: 'completed',
        progress: 100
      }));

      // Clear drafts and post context
      clearDrafts();
      clearMeta();

      // Show success message
      Alert.alert(
        'Success!',
        'Your fit pic has been posted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to home or previous screen
              router.back();
            }
          }
        ]
      );

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to post fit pic';
      
      setPostingState({
        isPosting: false,
        progress: 0,
        currentStep: 'error',
        error: errorMessage
      });

      Alert.alert(
        'Posting Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setPostingState({
                isPosting: false,
                progress: 0,
                currentStep: 'uploading'
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  }, [selectedIds, items, meta, postingState.isPosting, clearDrafts, clearMeta, router]);

  const resetPostingState = useCallback(() => {
    setPostingState({
      isPosting: false,
      progress: 0,
      currentStep: 'uploading'
    });
  }, []);

  return {
    postingState,
    handlePost,
    resetPostingState,
    canPost: selectedIds.length > 0 && meta.caption.trim().length > 0
  };
};
