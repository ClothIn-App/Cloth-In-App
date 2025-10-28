// app/create-modals/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DraftsProvider } from '../../components/create/draftcontext';
import { PostProvider } from '../../components/create/post/postcontext';

export default function ModalStackLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DraftsProvider>
        <PostProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
              name="fitpic_media" 
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
            <Stack.Screen 
              name="fitpic_post" 
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
            <Stack.Screen 
              name="addproduct" 
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
          </Stack>
        </PostProvider>
      </DraftsProvider>
    </GestureHandlerRootView>
  );
}
