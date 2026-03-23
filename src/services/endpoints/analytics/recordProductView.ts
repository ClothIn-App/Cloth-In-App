import type { EndpointDefinition } from "../../http";

export type RecordProductViewRequest = {
  productId: string;
  sessionId?: string;
  source?: string;
  device?: string;
  appVersion?: string;
};

export type RecordProductViewResponse = {
  ok: boolean;
};

export const recordProductViewEndpoint: EndpointDefinition<
  RecordProductViewRequest,
  RecordProductViewResponse
> = {
  key: "analytics.record_product_view",
  method: "POST",
  pathTemplate: "/v1/analytics/product-view",
  auth: "optional",
  mock: async () => ({ ok: true }),
};
