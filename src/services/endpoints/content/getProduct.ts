import type { EndpointDefinition } from "../../http";
import type { Product } from "../../../types/content";

export type GetProductRequest = {
  productId: string;
};

export type GetProductResponse = {
  product: Product;
};

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
    const data = (await import("../../../mocks/mock-products.json")).default;

    const product = data.products.find((p: any) => p.id === productId);

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return { product: product as Product };
  },
};

