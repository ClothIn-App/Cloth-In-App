/**
 * FitPic API Service
 * Handles all FitPic-related API calls with mock implementations
 * These mocks are designed to be 1:1 templates for the backend API
 */

import { 
  FitPic, 
  CreateFitPicRequest, 
  CreateFitPicResponse,
  GetFitPicResponse,
  GetFitPicsResponse,
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse,
  GetFeedRequest,
  GetFeedResponse,
  FitPicFilters,
  FitPicSortOptions
} from '../types/fitpic';

// Mock data structure (replacing deleted JSON file)
const fitpicsData = {
  fitpics: []
};

// Simulate API delay
const API_DELAY = 800; // ms

// Mock user ID for current user
const CURRENT_USER_ID = 'u_demo';

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to upload photos (mock implementation)
const uploadPhotos = async (photos: CreateFitPicRequest['photos']): Promise<FitPic['photos']> => {
  await delay(500); // Simulate upload time
  
  return photos.map((photo, index) => ({
    id: generateId('ph'),
    url: photo.uri, // In real implementation, this would be the uploaded URL
    thumbnailUrl: photo.uri, // In real implementation, this would be a resized version
    index,
    isCover: index === 0,
    width: 800,
    height: 1000,
    alt: `Photo ${index + 1}`
  }));
};

// Helper function to get current user info
const getCurrentUser = () => ({
  uid: CURRENT_USER_ID,
  username: 'janedoe',
  displayName: 'Jane Doe',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
});

// Helper function to sort fitpics
const sortFitPics = (fitpics: FitPic[], sort: FitPicSortOptions): FitPic[] => {
  const sorted = [...fitpics];
  
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'most_liked':
      return sorted.sort((a, b) => b.engagement.likes - a.engagement.likes);
    case 'most_saved':
      return sorted.sort((a, b) => b.engagement.saves - a.engagement.saves);
    case 'trending':
      // Simple trending algorithm: combination of recent likes and recency
      return sorted.sort((a, b) => {
        const aScore = a.engagement.likes + (new Date().getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const bScore = b.engagement.likes + (new Date().getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return bScore - aScore;
      });
    default:
      return sorted;
  }
};

// Helper function to filter fitpics
const filterFitPics = (fitpics: FitPic[], filters?: FitPicFilters): FitPic[] => {
  if (!filters) return fitpics;
  
  return fitpics.filter(fitpic => {
    if (filters.userId && fitpic.authorId !== filters.userId) return false;
    if (filters.hasProducts && fitpic.products.length === 0) return false;
    if (filters.dateRange) {
      const fitpicDate = new Date(fitpic.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (fitpicDate < startDate || fitpicDate > endDate) return false;
    }
    if (filters.engagement) {
      if (filters.engagement.minLikes && fitpic.engagement.likes < filters.engagement.minLikes) return false;
      if (filters.engagement.minSaves && fitpic.engagement.saves < filters.engagement.minSaves) return false;
    }
    return true;
  });
};

/**
 * Create a new FitPic
 */
export const createFitPic = async (request: CreateFitPicRequest): Promise<CreateFitPicResponse> => {
  try {
    await delay(API_DELAY);
    
    // Upload photos
    const photos = await uploadPhotos(request.photos);
    
    // Create the fitpic
    const fitpic: FitPic = {
      id: generateId('fp'),
      authorId: CURRENT_USER_ID,
      author: getCurrentUser(),
      photos,
      caption: request.caption,
      products: request.products || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      engagement: {
        likes: 0,
        saves: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        isSaved: false
      },
      location: request.location,
      isPublic: request.isPublic !== false,
      isReported: false,
      isHidden: false
    };
    
    // In a real implementation, this would be saved to the database
    // For now, we'll just return the created fitpic
    
    return {
      success: true,
      fitpic
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create fitpic'
    };
  }
};

/**
 * Get a FitPic by ID
 */
export const getFitPicById = async (id: string): Promise<GetFitPicResponse> => {
  try {
    await delay(API_DELAY);
    
    const fitpic = fitpicsData.fitpics.find(fp => fp.id === id);
    
    if (!fitpic) {
      return {
        success: false,
        error: 'FitPic not found'
      };
    }
    
    return {
      success: true,
      fitpic: fitpic as FitPic
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch fitpic'
    };
  }
};

/**
 * Get FitPics for a specific user
 */
export const getUserFitPics = async (
  userId: string, 
  cursor?: string, 
  limit: number = 20
): Promise<GetFitPicsResponse> => {
  try {
    await delay(API_DELAY);
    
    const userFitPics = fitpicsData.fitpics.filter(fp => fp.authorId === userId);
    const sortedFitPics = sortFitPics(userFitPics, 'newest');
    
    // Simple pagination (in real implementation, this would be handled by the backend)
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedFitPics = sortedFitPics.slice(startIndex, endIndex);
    
    return {
      success: true,
      fitpics: paginatedFitPics as FitPic[],
      pagination: {
        hasMore: endIndex < sortedFitPics.length,
        nextCursor: endIndex < sortedFitPics.length ? endIndex.toString() : undefined
      }
    };
  } catch (error) {
    return {
      success: false,
      fitpics: [],
      error: error instanceof Error ? error.message : 'Failed to fetch user fitpics'
    };
  }
};

/**
 * Get feed FitPics (For You, Following, Trending)
 */
export const getFeedFitPics = async (request: GetFeedRequest): Promise<GetFeedResponse> => {
  try {
    await delay(API_DELAY);
    
    let fitpics = [...fitpicsData.fitpics] as FitPic[];
    
    // Apply filters
    fitpics = filterFitPics(fitpics, request.filters);
    
    // Apply sorting
    const sortOption = request.sort || (request.type === 'trending' ? 'trending' : 'newest');
    fitpics = sortFitPics(fitpics, sortOption);
    
    // Simple pagination
    const startIndex = request.cursor ? parseInt(request.cursor) : 0;
    const limit = request.limit || 20;
    const endIndex = startIndex + limit;
    const paginatedFitPics = fitpics.slice(startIndex, endIndex);
    
    return {
      success: true,
      fitpics: paginatedFitPics,
      pagination: {
        hasMore: endIndex < fitpics.length,
        nextCursor: endIndex < fitpics.length ? endIndex.toString() : undefined
      }
    };
  } catch (error) {
    return {
      success: false,
      fitpics: [],
      pagination: { hasMore: false },
      error: error instanceof Error ? error.message : 'Failed to fetch feed'
    };
  }
};

/**
 * Update FitPic engagement (like, save, etc.)
 */
export const updateFitPicEngagement = async (
  request: UpdateFitPicEngagementRequest
): Promise<UpdateFitPicEngagementResponse> => {
  try {
    await delay(API_DELAY);
    
    const fitpic = fitpicsData.fitpics.find(fp => fp.id === request.fitpicId);
    
    if (!fitpic) {
      return {
        success: false,
        error: 'FitPic not found'
      };
    }
    
    // Update engagement based on action
    const engagement = { ...fitpic.engagement };
    
    switch (request.action) {
      case 'like':
        engagement.likes += 1;
        engagement.isLiked = true;
        break;
      case 'unlike':
        engagement.likes = Math.max(0, engagement.likes - 1);
        engagement.isLiked = false;
        break;
      case 'save':
        engagement.saves += 1;
        engagement.isSaved = true;
        break;
      case 'unsave':
        engagement.saves = Math.max(0, engagement.saves - 1);
        engagement.isSaved = false;
        break;
    }
    
    // In a real implementation, this would update the database
    fitpic.engagement = engagement;
    
    return {
      success: true,
      engagement
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update engagement'
    };
  }
};

/**
 * Delete a FitPic
 */
export const deleteFitPic = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await delay(API_DELAY);
    
    const fitpicIndex = fitpicsData.fitpics.findIndex(fp => fp.id === id);
    
    if (fitpicIndex === -1) {
      return {
        success: false,
        error: 'FitPic not found'
      };
    }
    
    // Check if user owns the fitpic
    const fitpic = fitpicsData.fitpics[fitpicIndex];
    if (fitpic.authorId !== CURRENT_USER_ID) {
      return {
        success: false,
        error: 'Not authorized to delete this fitpic'
      };
    }
    
    // In a real implementation, this would delete from the database
    // Note: We don't actually mutate the mock data to avoid side effects
    // fitpicsData.fitpics.splice(fitpicIndex, 1);
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete fitpic'
    };
  }
};

/**
 * Report a FitPic
 */
export const reportFitPic = async (id: string, reason: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await delay(API_DELAY);
    
    const fitpic = fitpicsData.fitpics.find(fp => fp.id === id);
    
    if (!fitpic) {
      return {
        success: false,
        error: 'FitPic not found'
      };
    }
    
    // In a real implementation, this would create a report record
    fitpic.isReported = true;
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to report fitpic'
    };
  }
};
