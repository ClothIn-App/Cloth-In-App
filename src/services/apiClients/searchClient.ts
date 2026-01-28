import { callApiEndpoint } from "../http";
import {
  searchUsersEndpoint,
  SearchUsersRequest,
  SearchUsersResponse,
  searchProductsEndpoint,
  SearchProductsRequest,
  SearchProductsResponse,
  searchFitPicsEndpoint,
  SearchFitPicsRequest,
  SearchFitPicsResponse,
  getSuggestionsEndpoint,
  GetSuggestionsRequest,
  GetSuggestionsResponse,
  getTrendingEndpoint,
  GetTrendingRequest,
  GetTrendingResponse,
} from "../endpoints";

// function-style
export async function searchUsers(
  params: SearchUsersRequest
): Promise<SearchUsersResponse> {
  return callApiEndpoint<SearchUsersRequest, SearchUsersResponse>(
    searchUsersEndpoint,
    { queryParameters: params }
  );
}

export async function searchProducts(
  params: SearchProductsRequest
): Promise<SearchProductsResponse> {
  return callApiEndpoint<SearchProductsRequest, SearchProductsResponse>(
    searchProductsEndpoint,
    { queryParameters: params }
  );
}

export async function searchFitPics(
  params: SearchFitPicsRequest
): Promise<SearchFitPicsResponse> {
  return callApiEndpoint<SearchFitPicsRequest, SearchFitPicsResponse>(
    searchFitPicsEndpoint,
    { queryParameters: params }
  );
}

export async function getSuggestions(
  params: GetSuggestionsRequest
): Promise<GetSuggestionsResponse> {
  return callApiEndpoint<GetSuggestionsRequest, GetSuggestionsResponse>(
    getSuggestionsEndpoint,
    { queryParameters: params }
  );
}

export async function getTrending(
  params?: GetTrendingRequest
): Promise<GetTrendingResponse> {
  return callApiEndpoint<GetTrendingRequest, GetTrendingResponse>(
    getTrendingEndpoint,
    { queryParameters: params || {} }
  );
}

// object-style (what your screens use)
export const searchApiClient = {
  searchUsers,
  searchProducts,
  searchFitPics,
  getSuggestions,
  getTrending,
};

// Export types
export type {
  SearchUsersRequest,
  SearchUsersResponse,
  SearchProductsRequest,
  SearchProductsResponse,
  SearchFitPicsRequest,
  SearchFitPicsResponse,
  GetSuggestionsRequest,
  GetSuggestionsResponse,
  GetTrendingRequest,
  GetTrendingResponse,
};

