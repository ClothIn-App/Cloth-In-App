export type OnboardingAnswers = {
  styleIdentity: string[];
  styleVibes: string[];
  categories: string[];
  occasions: string[];
  priceTiers: string[];
  selectedBrandIds: string[];
};

export type RecommendedBrand = {
  brandId: string;
  name: string;
  score: number;
};

export type GetRecommendedBrandsPayload = {
  styleIdentity: string[];
  styleVibes: string[];
  categories: string[];
  occasions: string[];
  priceTiers: string[];
};

export type GetRecommendedBrandsResponse = {
  brands: RecommendedBrand[];
};

export type SaveOnboardingPayload = {
  styleIdentity: string[];
  styleVibes: string[];
  categories: string[];
  occasions: string[];
  priceTiers: string[];
  selectedBrandIds: string[];
  onboardingVersion: string;
};

export type SaveOnboardingResponse = {
  success: boolean;
};
