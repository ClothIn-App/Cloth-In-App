// app/modals/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DraftsProvider } from '../../src/create/draftcontext';
import { PostProvider } from '../../src/create/post/postcontext';

export default function ModalStackLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraftsProvider>
        <PostProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PostProvider>
      </DraftsProvider>
    </GestureHandlerRootView>
  );
}
