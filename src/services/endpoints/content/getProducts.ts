import type { EndpointDefinition } from "../../http";
import type { Product } from "../../../types/content";

export type GetProductsRequest = {
  limit?: number;
  cursor?: string;
  userId?: string;
};

export type GetProductsResponse = {
  products: Product[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const getProductsEndpoint: EndpointDefinition<
  GetProductsRequest,
  GetProductsResponse
> = {
  key: "content.products",
  method: "GET",
  pathTemplate: "/v1/content/products",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const limit = Number(queryParameters.limit) || 20;
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;

    const data = (await import("../../../mocks/mock-products.json")).default;
    const products = data.products.slice(startIndex, endIndex) as Product[];

    return {
      products,
      pagination: {
        hasMore: endIndex < data.products.length,
        nextCursor: endIndex < data.products.length ? endIndex.toString() : undefined,
      },
    };
  },
};

