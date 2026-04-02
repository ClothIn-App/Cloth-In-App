import type { EndpointDefinition } from "../../http";
import type { ProductSearchResult } from "../../../types/search";
import { filterProducts } from "../../search/filterUtils";

/** Same-category first, then backfill; mirrors server search_products soft category. */
function orderProductsSoftCategory(
  products: ProductSearchResult[],
  categoryParam: string | undefined
): ProductSearchResult[] {
  const cat = categoryParam?.trim();
  if (!cat) return products;
  const catNorm = cat.toLowerCase();
  const tier1 = products.filter(
    (p) => (p.category || "").trim().toLowerCase() === catNorm
  );
  const tier2 = products.filter(
    (p) => (p.category || "").trim().toLowerCase() !== catNorm
  );
  return [...tier1, ...tier2];
}

export type SearchProductsRequest = {
  q?: string;
  sortBy?: "relevance" | "newest" | "price_low" | "price_high" | "most_liked";
  limit?: number;
  cursor?: string;
  brands?: string;
  brandId?: string;
  /** Case-insensitive exact match on product `brand` when no brandId. */
  brandName?: string;
  /** Soft category path: prefer matches, then same-brand pool (see orderProductsSoftCategory). */
  category?: string;
  categories?: string;
  priceMin?: number;
  priceMax?: number;
};

export type SearchProductsResponse = {
  products: ProductSearchResult[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  };
};

export const searchProductsEndpoint: EndpointDefinition<
  SearchProductsRequest,
  SearchProductsResponse
> = {
  key: "search.products",
  method: "GET",
  pathTemplate: "/v1/search/products",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const q = (queryParameters.q as string)?.trim() || "";

    // Load mock data dynamically
    const productsData = (await import("../../../mocks/mock-products.json")).default;

    // Use shared filtering function with loaded data
    let products = filterProducts(productsData.products, q);

    const brandIdParam = (queryParameters.brandId as string)?.trim();
    const brandNameExact = (queryParameters.brandName as string)?.trim();
    if (brandIdParam) {
      const idLower = brandIdParam.toLowerCase();
      products = products.filter(
        (p) => (p.brandId || "").toLowerCase() === idLower
      );
    } else if (brandNameExact) {
      const want = brandNameExact.toLowerCase();
      products = products.filter(
        (p) => (p.brand || "").trim().toLowerCase() === want
      );
    }

    // Filter by brand (legacy substring list)
    const brands = (queryParameters.brands as string)?.split(",").filter(Boolean);
    if (brands && brands.length > 0) {
      products = products.filter((p) =>
        brands.some((b) => p.brand?.toLowerCase().includes(b.toLowerCase()))
      );
    }

    // Filter by category
    const categories = (queryParameters.categories as string)?.split(",").filter(Boolean);
    if (categories && categories.length > 0) {
      products = products.filter((p) =>
        categories.some((c) => p.category?.toLowerCase().includes(c.toLowerCase()))
      );
    }

    // Filter by price range
    const priceMin = queryParameters.priceMin ? Number(queryParameters.priceMin) : undefined;
    const priceMax = queryParameters.priceMax ? Number(queryParameters.priceMax) : undefined;
    if (priceMin !== undefined) {
      products = products.filter((p) => (p.price || 0) >= priceMin);
    }
    if (priceMax !== undefined) {
      products = products.filter((p) => (p.price || 0) <= priceMax);
    }

    // Apply sorting
    const sortBy = (queryParameters.sortBy as string) || "relevance";
    if (sortBy === "price_low") {
      products.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_high") {
      products.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "most_liked") {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const softCategory = (queryParameters.category as string | undefined)?.trim();
    products = orderProductsSoftCategory(products, softCategory);

    // Apply pagination
    const limit = Number(queryParameters.limit) || 20;
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        hasMore: endIndex < products.length,
        nextCursor: endIndex < products.length ? endIndex.toString() : undefined,
      },
    };
  },
};

