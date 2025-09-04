// app/modals/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DraftsProvider } from '../../src/FitPic/draftcontext';
import { PostDraftProvider } from '../../src/FitPic/post/postdraftprovider';

export default function ModalStackLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraftsProvider>
        <PostDraftProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PostDraftProvider>
      </DraftsProvider>
    </GestureHandlerRootView>
  );
}
