/**
 * Photo Upload Service
 * Handles multiple image uploads for FitPics
 * Mock implementation that simulates real upload behavior
 */

export type PhotoUploadRequest = {
  uri: string;
  type: string;
  name: string;
  size?: number;
};

export type PhotoUploadResponse = {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  uploadId?: string;
};

export type BatchUploadResponse = {
  success: boolean;
  uploads: PhotoUploadResponse[];
  errors?: string[];
};

// Simulate upload progress
export type UploadProgress = {
  uploadId: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
};

// Mock upload delay
const UPLOAD_DELAY = 2000; // 2 seconds per photo
const PROCESSING_DELAY = 1000; // 1 second for processing

// Helper function to generate upload IDs
const generateUploadId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to simulate upload progress
const simulateUploadProgress = (
  uploadId: string,
  onProgress: (progress: UploadProgress) => void
): Promise<PhotoUploadResponse> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20; // Random progress increments
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Simulate processing
        onProgress({
          uploadId,
          progress: 100,
          status: 'processing'
        });
        
        setTimeout(() => {
          onProgress({
            uploadId,
            progress: 100,
            status: 'completed'
          });
          
          resolve({
            success: true,
            url: `https://mock-cdn.example.com/uploads/${uploadId}.jpg`,
            thumbnailUrl: `https://mock-cdn.example.com/thumbnails/${uploadId}.jpg`,
            uploadId
          });
        }, PROCESSING_DELAY);
      } else {
        onProgress({
          uploadId,
          progress: Math.round(progress),
          status: 'uploading'
        });
      }
    }, 200); // Update every 200ms
  });
};

/**
 * Upload a single photo
 */
export const uploadPhoto = async (
  photo: PhotoUploadRequest,
  onProgress?: (progress: UploadProgress) => void
): Promise<PhotoUploadResponse> => {
  try {
    const uploadId = generateUploadId();
    
    // Validate photo
    if (!photo.uri) {
      return {
        success: false,
        error: 'No photo URI provided'
      };
    }
    
    if (photo.size && photo.size > 10 * 1024 * 1024) { // 10MB limit
      return {
        success: false,
        error: 'Photo size exceeds 10MB limit'
      };
    }
    
    // Simulate upload with progress
    const result = await simulateUploadProgress(uploadId, onProgress || (() => {}));
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Upload multiple photos in parallel
 */
export const uploadPhotos = async (
  photos: PhotoUploadRequest[],
  onProgress?: (uploadId: string, progress: UploadProgress) => void
): Promise<BatchUploadResponse> => {
  try {
    if (photos.length === 0) {
      return {
        success: true,
        uploads: []
      };
    }
    
    if (photos.length > 10) {
      return {
        success: false,
        uploads: [],
        errors: ['Maximum 10 photos allowed per upload']
      };
    }
    
    // Upload all photos in parallel
    const uploadPromises = photos.map(photo => 
      uploadPhoto(photo, (progress) => {
        onProgress?.(progress.uploadId, progress);
      })
    );
    
    const results = await Promise.all(uploadPromises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    return {
      success: failed.length === 0,
      uploads: results,
      errors: failed.map(f => f.error).filter(Boolean) as string[]
    };
  } catch (error) {
    return {
      success: false,
      uploads: [],
      errors: [error instanceof Error ? error.message : 'Batch upload failed']
    };
  }
};

/**
 * Cancel an upload (mock implementation)
 */
export const cancelUpload = async (uploadId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // In a real implementation, this would cancel the actual upload
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel upload'
    };
  }
};

/**
 * Get upload status (mock implementation)
 */
export const getUploadStatus = async (uploadId: string): Promise<{
  success: boolean;
  status?: UploadProgress['status'];
  progress?: number;
  error?: string;
}> => {
  try {
    // In a real implementation, this would check the actual upload status
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      success: true,
      status: 'completed',
      progress: 100
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get upload status'
    };
  }
};

/**
 * Delete uploaded photo (mock implementation)
 */
export const deleteUploadedPhoto = async (url: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // In a real implementation, this would delete the file from storage
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete photo'
    };
  }
};
