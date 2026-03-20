// app/survey.tsx
export const options = { headerShown: false };

import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { userClient } from '@/src/services/apiClients';
import SurveyScreen, { type SurveyResponses } from '@/src/screens/SurveyScreen';

export default function Survey() {
  const router = useRouter();
  const { auth } = useAuth();

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const handleSubmit = async (finalResponses: SurveyResponses) => {
    const uid = auth?.user?.uid;
    if (uid) {
      await userClient.setUser(uid, { survey: finalResponses });
    }
    router.replace('/(tabs)/home');
  };

  return (
    <SurveyScreen
      onSkip={handleSkip}
      onSubmit={handleSubmit}
    />
  );
}
