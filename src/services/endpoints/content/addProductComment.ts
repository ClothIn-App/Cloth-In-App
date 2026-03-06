import type { EndpointDefinition } from "../../http";
import type {
  AddProductCommentRequest,
  AddProductCommentResponse,
} from "../../types/product";

export const addProductCommentEndpoint: EndpointDefinition<
  AddProductCommentRequest,
  AddProductCommentResponse
> = {
  key: "products.addComment",
  method: "POST",
  pathTemplate: "/v1/products/:productId/comments",
  auth: "required",
  mock: async ({ body }) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!body?.text?.trim()) {
      return { success: false, error: "text is required" };
    }
    return {
      success: true,
      comment: {
        id: `c_${Date.now()}`,
        user: "current_user",
        text: body.text.trim(),
        createdAt: new Date().toISOString(),
        like: 0,
        dislike: 0,
        replies: [],
      },
    };
  },
};
