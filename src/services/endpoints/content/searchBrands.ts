import type { EndpointDefinition } from "../../http";

export type SearchBrandsParams = {
  q?: string;
  limit?: number;
};

export type BrandSearchHit = {
  brandId: string;
  name: string;
};

export type SearchBrandsResponse = {
  brands: BrandSearchHit[];
};

export const searchBrandsEndpoint: EndpointDefinition<
  undefined,
  SearchBrandsResponse
> = {
  key: "content.searchBrands",
  method: "GET",
  pathTemplate: "/v1/brands/search",
  auth: "required",
  mock: async ({ queryParameters }) => {
    const q = (queryParameters.q || "").toLowerCase();
    const samples: BrandSearchHit[] = [
      { brandId: "mock-zara", name: "Zara" },
      { brandId: "mock-cos", name: "COS" },
    ];
    const brands = q
      ? samples.filter((b) => b.name.toLowerCase().includes(q))
      : samples;
    return { brands };
  },
};
