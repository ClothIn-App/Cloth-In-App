import type { EndpointDefinition } from "../../http";
import type { Product, ProductPriceType } from "../../../types/content";

export type CreateProductImage = {
  url: string;
  width?: number;
  height?: number;
};

export type CreateProductRequest = {
  productId?: string;
  name: string;
  brand: string;
  brandId?: string;
  category: string;
  description?: string;
  specifications?: string;
  productUrl?: string;
  priceType: ProductPriceType;
  price?: number;
  originalPrice?: number;
  currency?: string;
  images: CreateProductImage[];
};

export type CreateProductResponse = {
  success: boolean;
  product?: Product;
  error?: string;
};

export const createProductEndpoint: EndpointDefinition<
  CreateProductRequest,
  CreateProductResponse
> = {
  key: "content.createProduct",
  method: "POST",
  pathTemplate: "/v1/products",
  auth: "required",
  // Mock implementation: echo back a product-shaped object so the UI doesn't break
  mock: async ({ body }) => {
    const now = new Date().toISOString();
    const id = body?.productId ?? `P_mock_${Date.now()}`;
    const firstImage = body?.images?.[0]?.url ?? "";

    const product: Product = {
      id,
      name: body?.name ?? "New Product",
      brand: body?.brand ?? "Brand",
      price: body?.price ?? 0,
      originalPrice: body?.originalPrice,
      priceType: body?.priceType,
      imagePath: firstImage || "assets/mock-products/c-d-x-PDX_a_82obo-unsplash.jpg",
      description: body?.description ?? "",
      specs: body?.specifications,
      productUrl: body?.productUrl,
      images: body?.images?.map((img) => img.url) ?? [],
      reactions: {
        counts: {
          LIKE: 0,
          THUMBS_UP: 0,
          FIRE: 0,
          DISLIKE: 0,
        },
      },
      comments: [],
    };

    return {
      success: true,
      product,
      error: undefined,
    };
  },
};

