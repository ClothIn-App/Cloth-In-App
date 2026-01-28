/**
 * FitPic API Service
 * Thin wrapper over fitpic endpoints - all data access goes through endpoints
 */

import { 
  CreateFitPicRequest, 
  CreateFitPicResponse,
  GetFitPicResponse,
  GetFitPicsResponse,
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse,
  GetFeedRequest,
  GetFeedResponse,
} from '../types/fitpic';
import { callApiEndpoint } from './http';
import {
  createFitPicEndpoint,
  getFitPicEndpoint,
  getFitPicsEndpoint,
  getFeedEndpoint,
  updateEngagementEndpoint,
  deleteFitPicEndpoint,
} from './endpoints';

/**
 * Create a new FitPic
 */
export const createFitPic = async (request: CreateFitPicRequest): Promise<CreateFitPicResponse> => {
  return callApiEndpoint<CreateFitPicRequest, CreateFitPicResponse>(
    createFitPicEndpoint,
    { requestBody: request }
  );
};

/**
 * Get a FitPic by ID
 */
export const getFitPicById = async (id: string): Promise<GetFitPicResponse> => {
  return callApiEndpoint<undefined, GetFitPicResponse>(
    getFitPicEndpoint,
    { pathParameters: { fitpicId: id } }
  );
};

/**
 * Get FitPics for a specific user
 */
export const getUserFitPics = async (
  userId: string, 
  cursor?: string, 
  limit: number = 20
): Promise<GetFitPicsResponse> => {
  return callApiEndpoint<undefined, GetFitPicsResponse>(
    getFitPicsEndpoint,
    {
      queryParameters: {
        user_id: userId,
        cursor,
        limit: limit.toString(),
      },
    }
  );
};

/**
 * Get feed FitPics (For You, Following, Trending)
 */
export const getFeedFitPics = async (request: GetFeedRequest): Promise<GetFeedResponse> => {
  return callApiEndpoint<GetFeedRequest, GetFeedResponse>(
    getFeedEndpoint,
    {
      queryParameters: {
        cursor: request.cursor,
        limit: request.limit?.toString(),
        sort: request.sort,
        filters: request.filters ? JSON.stringify(request.filters) : undefined,
      },
    }
  );
};

/**
 * Update FitPic engagement (like, save, etc.)
 */
export const updateFitPicEngagement = async (
  request: UpdateFitPicEngagementRequest
): Promise<UpdateFitPicEngagementResponse> => {
  return callApiEndpoint<UpdateFitPicEngagementRequest, UpdateFitPicEngagementResponse>(
    updateEngagementEndpoint,
    {
      pathParameters: { fitpicId: request.fitpicId },
      requestBody: request,
    }
  );
};

/**
 * Delete a FitPic
 */
export const deleteFitPic = async (id: string): Promise<{ success: boolean; error?: string }> => {
  return callApiEndpoint<undefined, { success: boolean; error?: string }>(
    deleteFitPicEndpoint,
    { pathParameters: { fitpicId: id } }
  );
};

/**
 * Report a FitPic
 * Note: This endpoint may not exist yet - keeping for backward compatibility
 */
export const reportFitPic = async (id: string, reason: string): Promise<{ success: boolean; error?: string }> => {
  // For now, just return success - this can be implemented as an endpoint later
  return {
    success: true
  };
};
