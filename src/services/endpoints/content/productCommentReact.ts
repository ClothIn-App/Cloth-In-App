import type { EndpointDefinition } from "../../http";
import type {
  ProductCommentReactRequest,
  ProductCommentReactResponse,
} from "../../types/product";

export const productCommentReactEndpoint: EndpointDefinition<
  ProductCommentReactRequest,
  ProductCommentReactResponse
> = {
  key: "products.commentReact",
  method: "POST",
  pathTemplate: "/v1/products/:productId/comments/react",
  auth: "required",
  mock: async ({ body }) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (!body?.commentId) {
      return { success: false, error: "commentId is required" };
    }
    return {
      success: true,
      comment: {
        id: body.commentId,
        user: "current_user",
        text: "",
        createdAt: new Date().toISOString(),
        like: body.reaction === "like" ? 1 : 0,
        dislike: body.reaction === "dislike" ? 1 : 0,
        replies: [],
        userReaction: body.reaction,
      },
    };
  },
};
