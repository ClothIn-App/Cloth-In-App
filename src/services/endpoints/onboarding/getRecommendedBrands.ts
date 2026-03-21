import type { EndpointDefinition } from "../../http";
import type {
  GetRecommendedBrandsPayload,
  GetRecommendedBrandsResponse,
} from "@/src/features/onboarding/types";
import { MOCK_RECOMMENDED_BRANDS } from "./mockBrands";

export const getRecommendedBrandsEndpoint: EndpointDefinition<
  GetRecommendedBrandsPayload,
  GetRecommendedBrandsResponse
> = {
  key: "onboarding.recommendedBrands",
  method: "POST",
  pathTemplate: "/v1/onboarding/recommend-brands",
  mock: async () => {
    await new Promise((r) => setTimeout(r, 300));
    return { brands: MOCK_RECOMMENDED_BRANDS };
  },
};
