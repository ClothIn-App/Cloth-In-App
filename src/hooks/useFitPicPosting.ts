/**
 * Hook for handling FitPic posting functionality
 * Integrates with the existing create flow and API services
 */

import { useCallback, useState } from 'react';
import { Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useDrafts } from '../../components/create/draftcontext';
import { usePost } from '../../components/create/post/postcontext';
import { requestFeedRefetch } from '../feedRefresh';
import { fitpicClient } from '../services/apiClients/fitpicClient';
import { uploadPhotos, type PhotoUploadRequest } from '../services/photoUploadService';
import type { CreateFitPicRequest } from '../types/fitpic';
import { resolveUploadUri } from '../utils/resolveUploadUri';

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

      // Resolve ph:// and content:// URIs to local file paths for upload
      const resolvedUris = await Promise.all(
        selectedPhotos.map((photo) => resolveUploadUri(photo!.id, photo!.uri))
      );
      const failedIndex = resolvedUris.findIndex((uri) => uri == null);
      if (failedIndex !== -1) {
        throw new Error(
          'Could not access photo from library. Try choosing it again.'
        );
      }

      // Prepare photos for upload using resolved URIs
      const photosToUpload: PhotoUploadRequest[] = selectedPhotos.map((photo, index) => ({
        uri: resolvedUris[index]!,
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

      // Resolve dimensions for each selected photo (same order as uploads), using resolved URIs
      const dimensionsList = await Promise.all(
        resolvedUris.map(
          (uri) =>
            new Promise<{ width?: number; height?: number }>((resolve) => {
              Image.getSize(
                uri!,
                (width, height) => resolve({ width, height }),
                () => resolve({})
              );
            })
        )
      );

      const successfulUploads = uploadResult.uploads.filter((u) => u.success);
      const createRequest: CreateFitPicRequest = {
        photos: successfulUploads.map((upload, index) => {
          const dims = dimensionsList[index];
          return {
            url: upload.url!,
            ...(dims?.width != null && { width: dims.width }),
            ...(dims?.height != null && { height: dims.height }),
          };
        }),
        caption: meta.caption,
        tags: meta.tags?.length ? meta.tags : undefined,
        products: meta.products || [],
        location: meta.location?.trim() || undefined,
        ...(uploadResult.fitpicId && { fitpicId: uploadResult.fitpicId }),
      };

      setPostingState(prev => ({
        ...prev,
        currentStep: 'creating',
        progress: 90
      }));

      // Create the FitPic via client
      const createResult = await fitpicClient.create(createRequest);

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

      // Signal feed to refetch when user returns to home
      requestFeedRefetch();

      // Dismiss create modal and reveal the existing home screen (refetches on focus)
      router.dismissTo('/(tabs)/home');

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
