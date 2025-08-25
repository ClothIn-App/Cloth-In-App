// app/modals/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { DraftsProvider } from '../../src/FitPic/draftcontext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ModalStackLayout() {
  return (
    <DraftsProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </DraftsProvider>
  );
}