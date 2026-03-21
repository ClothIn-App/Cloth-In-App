// app/survey.tsx
export const options = { headerShown: false };

import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { onboardingApiClient } from '@/src/services/apiClients';
import SurveyScreen from '@/src/screens/SurveyScreen';
import type { OnboardingAnswers, GetRecommendedBrandsPayload } from '@/src/features/onboarding/types';
import { ONBOARDING_VERSION } from '@/src/features/onboarding/questions';

export default function Survey() {
  const router = useRouter();
  const { auth } = useAuth();

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const handleFetchBrands = async (answers: Partial<OnboardingAnswers>) => {
    try {
      const payload: GetRecommendedBrandsPayload = {
        styleIdentity: answers.styleIdentity ?? [],
        styleVibes: answers.styleVibes ?? [],
        categories: answers.categories ?? [],
        occasions: answers.occasions ?? [],
        priceTiers: answers.priceTiers ?? [],
      };
      const result = await onboardingApiClient.getRecommendedBrands(payload);
      return result.brands;
    } catch {
      return [];
    }
  };

  const handleSubmit = async (answers: OnboardingAnswers) => {
    const uid = auth?.user?.uid;
    if (uid) {
      try {
        await onboardingApiClient.saveOnboarding(uid, {
          styleIdentity: answers.styleIdentity,
          styleVibes: answers.styleVibes,
          categories: answers.categories,
          occasions: answers.occasions,
          priceTiers: answers.priceTiers,
          selectedBrandIds: answers.selectedBrandIds,
          onboardingVersion: ONBOARDING_VERSION,
        });
      } catch {
        // Non-blocking: navigate home even if save fails
      }
    }
    router.replace('/(tabs)/home');
  };

  return (
    <SurveyScreen
      onSkip={handleSkip}
      onSubmit={handleSubmit}
      onFetchBrands={handleFetchBrands}
    />
  );
}
