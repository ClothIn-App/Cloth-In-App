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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="survey" options={{ headerShown: false }} />
          <Stack.Screen
            name="modals"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
