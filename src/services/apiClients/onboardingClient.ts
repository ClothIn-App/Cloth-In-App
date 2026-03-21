import { callApiEndpoint } from "../http";
import {
  getRecommendedBrandsEndpoint,
  saveOnboardingEndpoint,
} from "../endpoints/onboarding";
import type {
  GetRecommendedBrandsPayload,
  GetRecommendedBrandsResponse,
  SaveOnboardingPayload,
  SaveOnboardingResponse,
} from "@/src/features/onboarding/types";

export async function getRecommendedBrands(payload: GetRecommendedBrandsPayload) {
  return callApiEndpoint<GetRecommendedBrandsPayload, GetRecommendedBrandsResponse>(
    getRecommendedBrandsEndpoint,
    { requestBody: payload }
  );
}

export async function saveOnboarding(userId: string, payload: SaveOnboardingPayload) {
  return callApiEndpoint<SaveOnboardingPayload, SaveOnboardingResponse>(
    saveOnboardingEndpoint,
    { pathParameters: { userId }, requestBody: payload }
  );
}

export const onboardingApiClient = { getRecommendedBrands, saveOnboarding };
