/**
 * Photo Upload Service
 * Handles multiple image uploads for FitPics.
 * Uses real API (POST /v1/fitpics/uploads) when not in mock mode; otherwise simulates upload.
 */

import { log } from "../debug/log";

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
  fitpicId?: string;
};

// Simulate upload progress
export type UploadProgress = {
  uploadId: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
};

/** True when app is configured to use real API (not mocks). Aligns with http.ts. */
function useRealApi(): boolean {
  const mode = process.env.EXPO_PUBLIC_API_MODE as string | undefined;
  if (mode === "real") return true;
  if (mode === "mock") return false;
  return process.env.EXPO_PUBLIC_USE_MOCKS !== "true";
}

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

// Mock upload delay
const UPLOAD_DELAY = 2000; // 2 seconds per photo
const PROCESSING_DELAY = 1000; // 1 second for processing

// Helper function to generate upload IDs
const generateUploadId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/** Server upload response shape (POST /v1/fitpics/uploads). */
type ServerUploadItem = { url: string; path: string; contentType: string };

const UPLOAD_REQUEST_TIMEOUT_MS = 30_000;

async function uploadPhotosToServer(
  photos: PhotoUploadRequest[],
  onProgress?: (uploadId: string, progress: UploadProgress) => void
): Promise<BatchUploadResponse> {
  log.info("[UPLOAD] start", { photoCount: photos.length });

  const token = await (async () => {
    try {
      const { getValidIdToken } = await import("@/src/services/authTokenManager");
      return await getValidIdToken();
    } catch {
      return null;
    }
  })();
  if (!token) {
    return {
      success: false,
      uploads: photos.map(() => ({ success: false, error: "Unauthorized" })),
      errors: ["Missing auth token"],
    };
  }
  log.info("[UPLOAD] token ok");

  const formData = new FormData();
  photos.forEach((photo) => {
    formData.append("photos", {
      uri: photo.uri,
      name: photo.name,
      type: photo.type || "image/jpeg",
    } as unknown as Blob);
  });

  const uploadId = generateUploadId();
  onProgress?.(uploadId, { uploadId, progress: 0, status: "uploading" });

  const uploadUrl = `${BASE_API_URL}/v1/fitpics/uploads`;
  log.info("[UPLOAD] sending POST", { url: uploadUrl });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Let the browser set Content-Type with boundary for FormData
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    log.warn("[UPLOAD] timeout or error", { error: message, isTimeout });
    onProgress?.(uploadId, {
      uploadId,
      progress: 0,
      status: "failed",
      error: message,
    });
    return {
      success: false,
      uploads: photos.map(() => ({ success: false, error: message })),
      errors: [isTimeout ? "Request timeout" : message],
    };
  }
  clearTimeout(timeoutId);

  log.info("[UPLOAD] response", { status: res.status });

  if (!res.ok) {
    const errText = await res.text();
    onProgress?.(uploadId, {
      uploadId,
      progress: 0,
      status: "failed",
      error: errText || res.statusText,
    });
    return {
      success: false,
      uploads: photos.map(() => ({ success: false, error: errText || res.statusText })),
      errors: [errText || res.statusText],
    };
  }

  const data = (await res.json()) as { uploads?: ServerUploadItem[]; fitpicId?: string };
  const uploads = data.uploads ?? [];
  onProgress?.(uploadId, { uploadId, progress: 100, status: "completed" });

  const results: PhotoUploadResponse[] = uploads.map((u) => ({
    success: true,
    url: u.url,
    thumbnailUrl: u.url,
    uploadId: u.path,
  }));
  // If server returned fewer items than requested, fill failures
  while (results.length < photos.length) {
    results.push({ success: false, error: "Server did not return URL" });
  }

  return {
    success: results.every((r) => r.success),
    uploads: results,
    errors: results.filter((r) => !r.success).map((r) => r.error).filter(Boolean) as string[],
    fitpicId: data.fitpicId,
  };
}

/**
 * Upload product photos to POST /v1/products/uploads?productId=...
 * Stores under products/{productId}/ in storage. No fitpicId in response.
 */
async function uploadProductPhotosToServer(
  photos: PhotoUploadRequest[],
  productId: string,
  onProgress?: (uploadId: string, progress: UploadProgress) => void
): Promise<BatchUploadResponse> {
  log.info("[UPLOAD] product upload start", { photoCount: photos.length, productId });

  const token = await (async () => {
    try {
      const { getValidIdToken } = await import("@/src/services/authTokenManager");
      return await getValidIdToken();
    } catch {
      return null;
    }
  })();
  if (!token) {
    return {
      success: false,
      uploads: photos.map(() => ({ success: false, error: "Unauthorized" })),
      errors: ["Missing auth token"],
    };
  }

  const formData = new FormData();
  photos.forEach((photo) => {
    formData.append("photos", {
      uri: photo.uri,
      name: photo.name,
      type: photo.type || "image/jpeg",
    } as unknown as Blob);
  });

  const uploadId = generateUploadId();
  onProgress?.(uploadId, { uploadId, progress: 0, status: "uploading" });

  const uploadUrl = `${BASE_API_URL}/v1/products/uploads?productId=${encodeURIComponent(productId)}`;
  log.info("[UPLOAD] sending POST", { url: uploadUrl });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPLOAD_REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    log.warn("[UPLOAD] product upload timeout or error", { error: message, isTimeout });
    onProgress?.(uploadId, { uploadId, progress: 0, status: "failed", error: message });
    return {
      success: false,
      uploads: photos.map(() => ({ success: false, error: message })),
      errors: [isTimeout ? "Request timeout" : message],
    };
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const errText = await res.text();
    onProgress?.(uploadId, { uploadId, progress: 0, status: "failed", error: errText || res.statusText });
    return {
      success: false,
      uploads: photos.map(() => ({ success: false, error: errText || res.statusText })),
      errors: [errText || res.statusText],
    };
  }

  const data = (await res.json()) as { uploads?: ServerUploadItem[] };
  const uploads = data.uploads ?? [];
  onProgress?.(uploadId, { uploadId, progress: 100, status: "completed" });

  const results: PhotoUploadResponse[] = uploads.map((u) => ({
    success: true,
    url: u.url,
    thumbnailUrl: u.url,
    uploadId: u.path,
  }));
  while (results.length < photos.length) {
    results.push({ success: false, error: "Server did not return URL" });
  }

  return {
    success: results.every((r) => r.success),
    uploads: results,
    errors: results.filter((r) => !r.success).map((r) => r.error).filter(Boolean) as string[],
  };
}

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
 * Upload multiple photos in parallel.
 * When not in mock mode, uses real API POST /v1/fitpics/uploads and returns signed URLs.
 */
export const uploadPhotos = async (
  photos: PhotoUploadRequest[],
  onProgress?: (uploadId: string, progress: UploadProgress) => void
): Promise<BatchUploadResponse> => {
  try {
    if (photos.length === 0) {
      return {
        success: true,
        uploads: [],
      };
    }

    if (photos.length > 10) {
      return {
        success: false,
        uploads: [],
        errors: ["Maximum 10 photos allowed per upload"],
      };
    }

    if (useRealApi()) {
      return uploadPhotosToServer(photos, onProgress);
    }

    // Mock: upload all photos in parallel with simulated progress
    const uploadPromises = photos.map((photo) =>
      uploadPhoto(photo, (progress) => {
        onProgress?.(progress.uploadId, progress);
      })
    );

    const results = await Promise.all(uploadPromises);

    return {
      success: results.every((r) => r.success),
      uploads: results,
      errors: results.filter((r) => !r.success).map((r) => r.error).filter(Boolean) as string[],
    };
  } catch (error) {
    return {
      success: false,
      uploads: [],
      errors: [error instanceof Error ? error.message : "Batch upload failed"],
    };
  }
};

/**
 * Upload product photos to products/{productId}/ in storage.
 * When not in mock mode, uses POST /v1/products/uploads?productId=...
 * Mock mode returns simulated URLs (path not reflected in storage).
 */
export const uploadProductPhotos = async (
  photos: PhotoUploadRequest[],
  productId: string,
  onProgress?: (uploadId: string, progress: UploadProgress) => void
): Promise<BatchUploadResponse> => {
  try {
    if (photos.length === 0) {
      return { success: true, uploads: [] };
    }
    if (photos.length > 10) {
      return {
        success: false,
        uploads: [],
        errors: ["Maximum 10 photos allowed per upload"],
      };
    }
    if (useRealApi()) {
      return uploadProductPhotosToServer(photos, productId, onProgress);
    }
    // Mock: same simulated upload as fitpics (path not reflected)
    const uploadPromises = photos.map((photo) =>
      uploadPhoto(photo, (progress) => {
        onProgress?.(progress.uploadId, progress);
      })
    );
    const results = await Promise.all(uploadPromises);
    return {
      success: results.every((r) => r.success),
      uploads: results,
      errors: results.filter((r) => !r.success).map((r) => r.error).filter(Boolean) as string[],
    };
  } catch (error) {
    return {
      success: false,
      uploads: [],
      errors: [error instanceof Error ? error.message : "Product upload failed"],
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
