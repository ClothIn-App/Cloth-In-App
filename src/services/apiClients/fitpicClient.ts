import { callApiEndpoint } from "../http";
import {
  createFitPicEndpoint,
  getFitPicEndpoint,
  getFitPicsEndpoint,
  getFeedEndpoint,
  updateEngagementEndpoint,
  deleteFitPicEndpoint,
} from "../endpoints";

import type {
  CreateFitPicRequest,
  CreateFitPicResponse,
  GetFitPicResponse,
  GetFitPicsResponse,
  GetFeedRequest,
  GetFeedResponse,
  UpdateFitPicEngagementRequest,
  UpdateFitPicEngagementResponse,
} from "../types/fitpic";

// API client that calls endpoints directly via callApiEndpoint

export async function create(request: CreateFitPicRequest): Promise<CreateFitPicResponse> {
  return callApiEndpoint<CreateFitPicRequest, CreateFitPicResponse>(
    createFitPicEndpoint,
    { requestBody: request }
  );
}

export async function getById(id: string): Promise<GetFitPicResponse> {
  return callApiEndpoint<undefined, GetFitPicResponse>(
    getFitPicEndpoint,
    { pathParameters: { fitpicId: id } }
  );
}

export async function listByUser(
  userId: string,
  cursor?: string,
  limit?: number
): Promise<GetFitPicsResponse> {
  return callApiEndpoint<undefined, GetFitPicsResponse>(
    getFitPicsEndpoint,
    {
      queryParameters: {
        user_id: userId,
        cursor,
        limit: limit?.toString(),
      },
    }
  );
}

export async function getFeed(request: GetFeedRequest): Promise<GetFeedResponse> {
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
}

export async function updateEngagement(
  request: UpdateFitPicEngagementRequest
): Promise<UpdateFitPicEngagementResponse> {
  return callApiEndpoint<UpdateFitPicEngagementRequest, UpdateFitPicEngagementResponse>(
    updateEngagementEndpoint,
    {
      pathParameters: { fitpicId: request.fitpicId },
      requestBody: request,
    }
  );
}

export async function remove(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return callApiEndpoint<undefined, { success: boolean; error?: string }>(
    deleteFitPicEndpoint,
    { pathParameters: { fitpicId: id } }
  );
}

export const fitpicClient = {
  create,
  getById,
  listByUser,
  getFeed,
  updateEngagement,
  remove,
};


