import type { EndpointDefinition } from "../../http";
import type {
  UpdateProductEngagementRequest,
  UpdateProductEngagementResponse,
} from "../../types/product";

export const updateProductEngagementEndpoint: EndpointDefinition<
  UpdateProductEngagementRequest,
  UpdateProductEngagementResponse
> = {
  key: "products.updateEngagement",
  method: "POST",
  pathTemplate: "/v1/products/:productId/engagement",
  auth: "required",
  mock: async ({ body }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!body) {
      return { success: false, error: "Missing request body" };
    }
    return {
      success: true,
      reactions: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 },
    };
  },
};
