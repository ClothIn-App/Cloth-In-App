import type { EndpointDefinition } from "../../http";
import type { ProductPriceType } from "../../../types/content";
import type { CreateProductImage } from "./createProduct";

export type SubmitProductEditSuggestionRequest = {
  name: string;
  brand: string;
  brandId?: string;
  category: string;
  color?: string;
  description?: string;
  specifications?: string;
  productUrl?: string;
  priceType: ProductPriceType;
  price?: number;
  originalPrice?: number;
  currency?: string;
  images: CreateProductImage[];
};

export type SubmitProductEditSuggestionResponse = {
  submissionId: string;
  productId: string;
  status: "pending_review";
  fieldCount: number;
  submittedAt: string;
  fieldKeys?: string[];
};

export const submitProductEditSuggestionEndpoint: EndpointDefinition<
  SubmitProductEditSuggestionRequest,
  SubmitProductEditSuggestionResponse
> = {
  key: "content.submitProductEditSuggestion",
  method: "POST",
  pathTemplate: "/v1/products/:productId/edit-suggestions",
  auth: "required",
  mock: async ({ body, pathParameters }) => {
    await new Promise((r) => setTimeout(r, 300));
    const productId = pathParameters.productId ?? "unknown";
    return {
      submissionId: `mock_sub_${Date.now()}`,
      productId,
      status: "pending_review" as const,
      fieldCount: 1,
      submittedAt: new Date().toISOString(),
      fieldKeys: body?.name ? ["name"] : undefined,
    };
  },
};
