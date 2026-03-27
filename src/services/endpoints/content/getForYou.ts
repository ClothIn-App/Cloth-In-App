import type { EndpointDefinition } from "../../http";
import type { FitPic } from "../../../types/fitpic";
import { transformRawFitPic } from "../../fitpicUtils";

// ── Server response types ─────────────────────────────────────────────────
// Mirrors app/models/feed.py (FitPicFeedItem, ProductFeedItem, GetForYouResponse)
// and app/models/product.py (ProductSearchItem) in cloth-in-server.

export type ForYouProductData = {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  /** Server-side priceType mapped to display string: "Fixed" | "Sale" | "Sold Out" | "TBD" | "N/A" */
  priceStatus?: string | null;
  imageUrl?: string | null;
  purchaseUrl?: string | null;
  description?: string | null;
  specifications?: string | null;
  createdAt?: string | null;
};

export type ForYouFitPicItem = {
  type: "fitpic";
  fitpic: FitPic;
};

export type ForYouProductItem = {
  type: "product";
  product: ForYouProductData;
};

/** Discriminated union matching the server's ForYouFeedItem (feed.py). */
export type ForYouFeedItem = ForYouFitPicItem | ForYouProductItem;

// ── Request / Response ────────────────────────────────────────────────────

export type GetForYouRequest = {
  limit?: number;
  /** Opaque cursor from a previous response's pagination.nextCursor. */
  cursor?: string;
  /** When true, the server recomputes affinity from raw signals (expensive). */
  refresh?: boolean;
};

export type GetForYouResponse = {
  items: ForYouFeedItem[];
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
  } | null;
};

// ── Endpoint definition ───────────────────────────────────────────────────

export const getForYouEndpoint: EndpointDefinition<
  GetForYouRequest,
  GetForYouResponse
> = {
  key: "content.forYou",
  method: "GET",
  pathTemplate: "/v1/content/for-you",
  // For You is personalised; the server uses Depends(current_user_id).
  auth: "required",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 800));

    const [fitpicsModule, productsModule, usersModule] = await Promise.all([
      import("../../../mocks/mock-fitpics.json"),
      import("../../../mocks/mock-products.json"),
      import("../../../mocks/mock-users.json"),
    ]);

    const rawFitpics = fitpicsModule.default.fitpics;
    const rawProducts = productsModule.default.products;
    const usersData = usersModule.default;

    // Build all interleaved items in a deterministic 2 FitPic : 1 product order,
    // matching the server-side merge policy in for_you_feed_service.py.
    // No shuffle — ordering must be stable so order-preservation can be verified.
    const allItems: ForYouFeedItem[] = [];
    let fi = 0;
    let pi = 0;

    while (fi < rawFitpics.length || pi < rawProducts.length) {
      // 2 FitPics
      for (let j = 0; j < 2 && fi < rawFitpics.length; j++, fi++) {
        const fp = rawFitpics[fi];
        const userData = usersData[fp.author as keyof typeof usersData];
        const transformed = transformRawFitPic(fp, userData, rawProducts as any[]);
        if (transformed) {
          allItems.push({ type: "fitpic", fitpic: transformed });
        }
      }
      // 1 Product
      if (pi < rawProducts.length) {
        const p = rawProducts[pi++] as any;
        allItems.push({
          type: "product",
          product: {
            id: p.id,
            name: p.name,
            brand: p.brand ?? null,
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
        });
      }
    }

    const limit = Math.min(Number(queryParameters.limit) || 20, 100);
    const cursor = queryParameters.cursor as string | undefined;
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = startIndex + limit;

    return {
      items: allItems.slice(startIndex, endIndex),
      pagination:
        endIndex < allItems.length
          ? { hasMore: true, nextCursor: String(endIndex) }
          : null,
    };
  },
};
