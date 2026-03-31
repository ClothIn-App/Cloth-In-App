// app/_layout.tsx
import 'react-native-gesture-handler';
import '../src/bootstrap/authBootstrap';

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '../src/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="survey" options={{ headerShown: false }} />
          <Stack.Screen
            name="create-modals"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="user-settings"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="profile-edit"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="search-modal"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="search-results"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="fitpic-detail"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'fade_from_bottom',
            }}
          />
          <Stack.Screen
            name="product-detail"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'fade_from_bottom',
            }}
          />
          <Stack.Screen
            name="closet-product-detail"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'fade_from_bottom',
            }}
          />
          <Stack.Screen
            name="user/[userId]"
            options={{
              headerShown: false,
              presentation: 'card',
              gestureEnabled: true,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
