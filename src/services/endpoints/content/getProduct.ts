import type { EndpointDefinition } from "../../http";
import type { Product } from "../../../types/content";
import type { CommentType } from "../../../types/feed";

export type GetProductRequest = {
  productId: string;
};

export type GetProductResponse = {
  product: Product;
};

// Normalize comment: resolve userId to username and set authorId (same logic as getFitPic)
function normalizeProductComment(
  rawComment: any,
  usersData: Record<string, { username?: string }>
): CommentType {
  const rawUser = rawComment.user;
  let user: string;
  let authorId: string | undefined;

  if (rawUser != null && typeof rawUser === "string" && usersData[rawUser]) {
    user = usersData[rawUser].username ?? rawUser;
    authorId = rawUser;
  } else if (rawUser != null && typeof rawUser === "string" && rawUser.startsWith("u_")) {
    user = rawUser;
    authorId = rawUser;
  } else {
    user = rawUser ?? "";
    authorId = undefined;
  }

  const result: CommentType = {
    id: rawComment.id,
    user,
    text: rawComment.text,
    createdAt: rawComment.createdAt,
    likes: rawComment.likes ?? rawComment.like ?? 0,
    dislikes: rawComment.dislikes ?? rawComment.dislike ?? 0,
    replies: (rawComment.replies || []).map((r: any) => normalizeProductComment(r, usersData)),
  };
  if (authorId !== undefined) result.authorId = authorId;
  return result;
}

export const getProductEndpoint: EndpointDefinition<
  undefined,
  GetProductResponse
> = {
  key: "content.product",
  method: "GET",
  pathTemplate: "/v1/content/product/:productId",
  auth: "optional",
  mock: async ({ pathParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const productId = pathParameters.productId;
    const [productsData, usersData] = await Promise.all([
      import("../../../mocks/mock-products.json"),
      import("../../../mocks/mock-users.json"),
    ]);
    const data = productsData.default;
    const users = usersData.default as Record<string, { username?: string }>;

    const product = data.products.find((p: any) => p.id === productId);

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const productCopy = { ...product };
    if (Array.isArray(productCopy.comments)) {
      productCopy.comments = productCopy.comments.map((c: any) =>
        normalizeProductComment(c, users)
      ) as any;
    }

    return { product: productCopy as Product };
  },
};

