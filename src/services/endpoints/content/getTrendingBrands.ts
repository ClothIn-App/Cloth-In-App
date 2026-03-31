import type { EndpointDefinition } from "../../http";

export type GetTrendingBrandsParams = {
  limit?: number;
};

export type BrandTrendingHit = {
  brandId: string;
  name: string;
  activityLabel?: string | null;
};

export type GetTrendingBrandsResponse = {
  brands: BrandTrendingHit[];
};

export const getTrendingBrandsEndpoint: EndpointDefinition<
  undefined,
  GetTrendingBrandsResponse
> = {
  key: "content.getTrendingBrands",
  method: "GET",
  pathTemplate: "/v1/brands/trending",
  auth: "required",
  mock: async () => ({
    brands: [
      { brandId: "mock-hot", name: "Trend Mock", activityLabel: "popular" },
    ],
  }),
};
