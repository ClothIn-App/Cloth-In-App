import type { EndpointDefinition } from "../../http";

export type ProductMatchCheckEndpointRequest = {
  name: string;
  brand: string;
  brandId?: string;
  color?: string;
};

export type ProductMatchPreview = {
  brand?: string;
  name: string;
  color?: string;
  imageUrl?: string;
  shortDescription?: string;
};

export type ProductMatchCandidate = {
  productId: string;
  confidence: "very_high";
  preview: ProductMatchPreview;
};

export type ProductMatchCheckEndpointResponse = {
  matches: ProductMatchCandidate[];
  matchCheckId?: string;
};

export const productMatchCheckEndpoint: EndpointDefinition<
  ProductMatchCheckEndpointRequest,
  ProductMatchCheckEndpointResponse
> = {
  key: "content.productMatchCheck",
  method: "POST",
  pathTemplate: "/v1/products/match-check",
  auth: "required",
  mock: async ({ body }) => {
    await new Promise((r) => setTimeout(r, 300));
    // Return empty matches in mock so normal create proceeds by default
    return { matches: [], matchCheckId: `mock_${Date.now()}` };
  },
};
