// app/survey.tsx
export const options = { headerShown: false };

import React from 'react';
import { Alert } from 'react-native';
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
    if (!uid) {
      router.replace('/(tabs)/home');
      return;
    }

    try {
      await onboardingApiClient.saveOnboarding(uid, {
        styleIdentity: answers.styleIdentity,
        styleVibes: answers.styleVibes,
        categories: answers.categories,
        occasions: answers.occasions,
        priceTiers: answers.priceTiers,
        selectedBrandIds: answers.selectedBrandIds,
        typedBrandNames: answers.typedBrandNames,
        onboardingVersion: ONBOARDING_VERSION,
      });
      router.replace('/(tabs)/home');
    } catch {
      Alert.alert(
        'Could not save your preferences',
        'Your style choices could not be saved. Would you like to try again or continue without saving?',
        [
          {
            text: 'Try Again',
            onPress: () => handleSubmit(answers),
          },
          {
            text: 'Continue Anyway',
            style: 'destructive',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    }
  };

  return (
    <SurveyScreen
      onSkip={handleSkip}
      onSubmit={handleSubmit}
      onFetchBrands={handleFetchBrands}
    />
  );
}
