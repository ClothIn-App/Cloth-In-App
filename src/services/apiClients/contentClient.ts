import { callApiEndpoint } from "../http";
import {
  getProductEndpoint,
  GetProductRequest,
  GetProductResponse,
  getProductsEndpoint,
  GetProductsRequest,
  GetProductsResponse,
  createProductEndpoint,
  CreateProductRequest,
  CreateProductResponse,
  updateProductEngagementEndpoint,
  addProductCommentEndpoint,
  productCommentReactEndpoint,
} from "../endpoints";
import { getFitPicEndpoint, GetFitPicRequest, GetFitPicResponse } from "../endpoints/content/getFitPic";
import { getFitPicsEndpoint, GetFitPicsRequest, GetFitPicsResponse } from "../endpoints/content/getFitPics";
import { getFeedEndpoint, GetFeedRequest, GetFeedResponse } from "../endpoints/content/getFeed";
import type {
  UpdateProductEngagementRequest,
  UpdateProductEngagementResponse,
  AddProductCommentRequest,
  AddProductCommentResponse,
  ProductCommentReactRequest,
  ProductCommentReactResponse,
} from "../types/product";

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

export async function createProduct(
  request: CreateProductRequest
): Promise<CreateProductResponse> {
  return callApiEndpoint<CreateProductRequest, CreateProductResponse>(
    createProductEndpoint,
    { requestBody: request }
  );
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

export async function updateProductEngagement(
  request: UpdateProductEngagementRequest
): Promise<UpdateProductEngagementResponse> {
  return callApiEndpoint<UpdateProductEngagementRequest, UpdateProductEngagementResponse>(
    updateProductEngagementEndpoint,
    {
      pathParameters: { productId: request.productId },
      requestBody: request,
    }
  );
}

export async function addProductComment(
  productId: string,
  body: AddProductCommentRequest
): Promise<AddProductCommentResponse> {
  return callApiEndpoint<AddProductCommentRequest, AddProductCommentResponse>(
    addProductCommentEndpoint,
    {
      pathParameters: { productId },
      requestBody: body,
    }
  );
}

export async function productCommentReact(
  productId: string,
  body: ProductCommentReactRequest
): Promise<ProductCommentReactResponse> {
  return callApiEndpoint<ProductCommentReactRequest, ProductCommentReactResponse>(
    productCommentReactEndpoint,
    {
      pathParameters: { productId },
      requestBody: body,
    }
  );
}

// object-style (what your screens use)
export const contentApiClient = {
  getProduct,
  getFitPic,
  getFeed,
  getProducts,
  getFitPics,
  createProduct,
  updateProductEngagement,
  addProductComment,
  productCommentReact,
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
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductEngagementRequest,
  UpdateProductEngagementResponse,
  AddProductCommentRequest,
  AddProductCommentResponse,
  ProductCommentReactRequest,
  ProductCommentReactResponse,
};

