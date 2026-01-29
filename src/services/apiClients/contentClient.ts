import { callApiEndpoint } from "../http";
import {
  getProductEndpoint,
  GetProductRequest,
  GetProductResponse,
  getFitPicEndpoint,
  GetFitPicRequest,
  GetFitPicResponse,
  getProductsEndpoint,
  GetProductsRequest,
  GetProductsResponse,
  getFitPicsEndpoint,
  GetFitPicsRequest,
  GetFitPicsResponse,
} from "../endpoints";
// Import content feed endpoint directly to avoid conflict with fitpics feed endpoint
import { getFeedEndpoint, GetFeedRequest, GetFeedResponse } from "../endpoints/content/getFeed";

// function-style
export async function getProduct(
  productId: string
): Promise<GetProductResponse> {
  return callApiEndpoint<undefined, GetProductResponse>(getProductEndpoint, {
    pathParameters: { productId },
  });
}

export async function getFitPic(
  fitpicId: string
): Promise<GetFitPicResponse> {
  return callApiEndpoint<undefined, GetFitPicResponse>(getFitPicEndpoint, {
    pathParameters: { fitpicId },
  });
}

export async function getFeed(
  params?: GetFeedRequest
): Promise<GetFeedResponse> {
  return callApiEndpoint<GetFeedRequest, GetFeedResponse>(getFeedEndpoint, {
    queryParameters: params || {},
  });
}

export async function getProducts(
  params?: GetProductsRequest
): Promise<GetProductsResponse> {
  return callApiEndpoint<GetProductsRequest, GetProductsResponse>(
    getProductsEndpoint,
    { queryParameters: params || {} }
  );
}

export async function getFitPics(
  params?: GetFitPicsRequest
): Promise<GetFitPicsResponse> {
  return callApiEndpoint<GetFitPicsRequest, GetFitPicsResponse>(
    getFitPicsEndpoint,
    { queryParameters: params || {} }
  );
}

// object-style (what your screens use)
export const contentApiClient = {
  getProduct,
  getFitPic,
  getFeed,
  getProducts,
  getFitPics,
};

// Export types
export type {
  GetProductRequest,
  GetProductResponse,
  GetFitPicRequest,
  GetFitPicResponse,
  GetFeedRequest,
  GetFeedResponse,
  GetProductsRequest,
  GetProductsResponse,
  GetFitPicsRequest,
  GetFitPicsResponse,
};

