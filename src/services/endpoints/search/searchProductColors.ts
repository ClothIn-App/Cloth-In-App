import type { EndpointDefinition } from "../../http";
import {
  suggestProductColors,
  type ProductColorDoc,
} from "../../search/productColorSuggest";

/** Minimal mock product shape (mock JSON is not full ProductSearchResult). */
type MockProductRow = {
  name?: string;
  brand?: string;
  brandId?: string;
  category?: string;
};

export type SearchProductColorsRequest = {
  q?: string;
  productName?: string;
  category?: string;
  brandId?: string;
  brandName?: string;
  limit?: number;
};

export type SearchProductColorsResponse = {
  colors: string[];
};

function inferColorFromMockProduct(p: MockProductRow): string | null {
  const n = (p.name ?? "").toLowerCase();
  const pairs: [RegExp, string][] = [
    [/white/i, "White"],
    [/black/i, "Black"],
    [/navy/i, "Navy"],
    [/charcoal/i, "Charcoal"],
    [/grey|gray/i, "Gray"],
    [/blue/i, "Blue"],
    [/red/i, "Red"],
    [/green/i, "Green"],
    [/olive/i, "Olive"],
    [/beige/i, "Beige"],
    [/brown/i, "Brown"],
    [/cream/i, "Cream"],
    [/tan/i, "Tan"],
    [/burgundy/i, "Burgundy"],
  ];
  for (const [re, label] of pairs) {
    if (re.test(n)) return label;
  }
  return null;
}

function mockProductToColorDoc(p: MockProductRow): ProductColorDoc | null {
  const color = inferColorFromMockProduct(p);
  if (!color) return null;
  return {
    color,
    name: p.name,
    brand: p.brand,
    brandId: p.brandId,
    category: p.category,
  };
}

export const searchProductColorsEndpoint: EndpointDefinition<
  SearchProductColorsRequest,
  SearchProductColorsResponse
> = {
  key: "search.productColors",
  method: "GET",
  pathTemplate: "/v1/search/product-colors",
  auth: "optional",
  mock: async ({ queryParameters }) => {
    await new Promise((r) => setTimeout(r, 400));

    const q = String(queryParameters.q ?? "").trim();
    const productName = queryParameters.productName as string | undefined;
    const category = queryParameters.category as string | undefined;
    const brandId = queryParameters.brandId as string | undefined;
    const brandName = queryParameters.brandName as string | undefined;
    const limit = Number(queryParameters.limit) || 20;

    const data = (await import("../../../mocks/mock-products.json"))
      .default as unknown as { products: MockProductRow[] };

    const docs: ProductColorDoc[] = [];
    for (const p of data.products ?? []) {
      const d = mockProductToColorDoc(p);
      if (d) docs.push(d);
    }

    const colors = suggestProductColors(docs, q, {
      productName,
      category,
      brandId,
      brandName,
      limit: Math.min(50, Math.max(1, limit)),
    });

    return { colors };
  },
};
