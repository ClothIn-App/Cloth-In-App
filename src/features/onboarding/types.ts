/** Aligns with server `ONBOARDING_MAX_SELECTED_BRANDS` for optional client UX checks. */
export const ONBOARDING_MAX_SELECTED_BRANDS = 30;

export const SURVEY_BRAND_TEXT_MAX_CHARS = 100;

export type OnboardingAnswers = {
  styleIdentity: string[];
  styleVibes: string[];
  categories: string[];
  occasions: string[];
  priceTiers: string[];
  selectedBrandIds: string[];
  /** Free-text brand names to resolve/create on save (API); not canonical ids. */
  typedBrandNames: string[];
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
  typedBrandNames: string[];
  onboardingVersion: string;
};

export type SaveOnboardingResponse = {
  success: boolean;
};
