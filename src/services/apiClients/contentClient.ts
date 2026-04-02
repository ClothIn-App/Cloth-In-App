import { callApiEndpoint } from "../http";
import Constants from "expo-constants";
import { Platform } from "react-native";
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
  submitProductEditSuggestionEndpoint,
  SubmitProductEditSuggestionRequest,
  SubmitProductEditSuggestionResponse,
  searchBrandsEndpoint,
  SearchBrandsParams,
  SearchBrandsResponse,
  BrandSearchHit,
  getTrendingBrandsEndpoint,
  GetTrendingBrandsParams,
  GetTrendingBrandsResponse,
  BrandTrendingHit,
  updateProductEngagementEndpoint,
  addProductCommentEndpoint,
  productCommentReactEndpoint,
} from "../endpoints";
import { getFitPicEndpoint, GetFitPicRequest, GetFitPicResponse } from "../endpoints/content/getFitPic";
import { getFitPicsEndpoint, GetFitPicsRequest, GetFitPicsResponse } from "../endpoints/content/getFitPics";
import { getFeedEndpoint, GetFeedRequest, GetFeedResponse } from "../endpoints/content/getFeed";
import {
  getForYouEndpoint,
  GetForYouRequest,
  GetForYouResponse,
  ForYouFeedItem,
  ForYouFitPicItem,
  ForYouProductItem,
  ForYouProductData,
} from "../endpoints/content/getForYou";
import {
  getFollowingEndpoint,
  GetFollowingRequest,
  GetFollowingResponse,
  FollowingFitPicItem,
} from "../endpoints/content/getFollowing";
import {
  getBrowseEndpoint,
  GetBrowseRequest,
  GetBrowseResponse,
  BrowseProductItem,
  BrowseProductData,
} from "../endpoints/content/getBrowse";
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

function buildEditSuggestionHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const v =
    Constants.expoConfig?.version ??
    (Constants as { nativeAppVersion?: string }).nativeAppVersion;
  if (v) headers["X-App-Version"] = String(v);
  headers["X-Platform"] = Platform.OS;
  return headers;
}

export async function submitProductEditSuggestion(
  productId: string,
  request: SubmitProductEditSuggestionRequest,
  options?: { idempotencyKey?: string }
): Promise<SubmitProductEditSuggestionResponse> {
  const headers = buildEditSuggestionHeaders(
    options?.idempotencyKey
      ? { "Idempotency-Key": options.idempotencyKey }
      : undefined
  );
  return callApiEndpoint<
    SubmitProductEditSuggestionRequest,
    SubmitProductEditSuggestionResponse
  >(submitProductEditSuggestionEndpoint, {
    pathParameters: { productId },
    requestBody: request,
    headers,
  });
}

export async function searchBrands(
  params?: SearchBrandsParams
): Promise<SearchBrandsResponse> {
  return callApiEndpoint<undefined, SearchBrandsResponse>(searchBrandsEndpoint, {
    queryParameters: {
      q: params?.q ?? "",
      ...(params?.limit != null ? { limit: String(params.limit) } : {}),
    },
  });
}

export async function getTrendingBrands(
  params?: GetTrendingBrandsParams
): Promise<GetTrendingBrandsResponse> {
  return callApiEndpoint<undefined, GetTrendingBrandsResponse>(
    getTrendingBrandsEndpoint,
    {
      queryParameters: {
        ...(params?.limit != null ? { limit: String(params.limit) } : {}),
      },
    }
  );
}

export async function getFeed(
  params?: GetFeedRequest
): Promise<GetFeedResponse> {
  return callApiEndpoint<GetFeedRequest, GetFeedResponse>(getFeedEndpoint, {
    queryParameters: params || {},
  });
}

export async function getForYou(
  params?: GetForYouRequest
): Promise<GetForYouResponse> {
  return callApiEndpoint<GetForYouRequest, GetForYouResponse>(
    getForYouEndpoint,
    { queryParameters: params || {} }
  );
}

export async function getFollowing(
  params?: GetFollowingRequest
): Promise<GetFollowingResponse> {
  return callApiEndpoint<GetFollowingRequest, GetFollowingResponse>(
    getFollowingEndpoint,
    { queryParameters: params || {} }
  );
}

export async function getBrowse(
  params?: GetBrowseRequest
): Promise<GetBrowseResponse> {
  return callApiEndpoint<GetBrowseRequest, GetBrowseResponse>(
    getBrowseEndpoint,
    { queryParameters: params || {} }
  );
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
  getForYou,
  getFollowing,
  getBrowse,
  getProducts,
  getFitPics,
  createProduct,
  submitProductEditSuggestion,
  searchBrands,
  getTrendingBrands,
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
  GetForYouRequest,
  GetForYouResponse,
  ForYouFeedItem,
  ForYouFitPicItem,
  ForYouProductItem,
  ForYouProductData,
  GetFollowingRequest,
  GetFollowingResponse,
  FollowingFitPicItem,
  GetBrowseRequest,
  GetBrowseResponse,
  BrowseProductItem,
  BrowseProductData,
  GetProductsRequest,
  GetProductsResponse,
  GetFitPicsRequest,
  GetFitPicsResponse,
  CreateProductRequest,
  CreateProductResponse,
  SubmitProductEditSuggestionRequest,
  SubmitProductEditSuggestionResponse,
  SearchBrandsParams,
  SearchBrandsResponse,
  BrandSearchHit,
  GetTrendingBrandsParams,
  GetTrendingBrandsResponse,
  BrandTrendingHit,
  UpdateProductEngagementRequest,
  UpdateProductEngagementResponse,
  AddProductCommentRequest,
  AddProductCommentResponse,
  ProductCommentReactRequest,
  ProductCommentReactResponse,
};

