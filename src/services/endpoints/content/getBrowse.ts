import type { EndpointDefinition } from "../../http";

// ── Server response types ─────────────────────────────────────────────────
// Mirrors app/models/feed.py (ProductFeedItem, GetBrowseResponse)
// in cloth-in-server.

export type BrowseProductData = {
  id: string;
  name: string;
  brand?: string | null;
  brandId?: string | null;
  brandNameCanonical?: string | null;
  category?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  priceStatus?: string | null;
  imageUrl?: string | null;
  purchaseUrl?: string | null;
  description?: string | null;
  specifications?: string | null;
  createdAt?: string | null;
};

export type BrowseProductItem = {
  type: "product";
  product: BrowseProductData;
};

// ── Request / Response ────────────────────────────────────────────────────

export type GetBrowseRequest = {
  limit?: number;
  /** Opaque cursor from a previous response's pagination.nextCursor. */
  cursor?: string;
  /** When true, recompute affinity before building the feed. */
  refresh?: boolean;
};

export type GetBrowseResponse = {
  items: BrowseProductItem[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  } | null;
};

// ── Endpoint definition ───────────────────────────────────────────────────

export const getBrowseEndpoint: EndpointDefinition<
  GetBrowseRequest,
  GetBrowseResponse
> = {
  key: "content.browse",
  method: "GET",
  pathTemplate: "/v1/content/browse",
  auth: "required",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 600));
    const { default: data } = await import("../../../mocks/mock-products.json");
    const limit = Math.min(Number(queryParameters.limit) || 20, 100);
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + limit;
    const products = data.products.slice(startIndex, endIndex);
    return {
      items: products.map((p: any) => ({
        type: "product" as const,
        product: {
          id: p.id,
          name: p.name,
          brand: p.brand ?? null,
          brandId: p.brandId ?? null,
          brandNameCanonical: p.brandNameCanonical ?? null,
          category: p.category ?? null,
          price: p.price ?? null,
          originalPrice: p.originalPrice ?? null,
          currency: "USD",
          priceStatus: "Fixed",
          imageUrl: p.imagePath ?? null,
          purchaseUrl: p.productUrl ?? null,
          description: p.description ?? null,
          createdAt: p.createdAt ?? null,
        },
      })),
      pagination:
        endIndex < data.products.length
          ? { hasMore: true, nextCursor: String(endIndex) }
          : null,
    };
  },
};
