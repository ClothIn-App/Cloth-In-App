// tests/setupTests.ts

;(global as any).__DEV__ = true;

// Extend matchers (guarded so endpoints-only runs won't fail)
try { require('@testing-library/jest-native/extend-expect'); } catch {}

beforeEach(() => {
  // Use real timers by default
  jest.useRealTimers();

  // Silence logs in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();

  // IMPORTANT:
  // Do NOT call jest.resetModules() here—the app (RN) tests rely on
  // RN/Expo mocks that are set up once per test file. Resetting modules
  // nukes those mocks after test #1, causing Animated/reanimated crashes.
  //
  // Endpoint tests that need fresh modules already call jest.resetModules()
  // inside those test files.

  // Clean up per-test globals/env
  delete (global as any).fetch;

  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
  delete process.env.EXPO_PUBLIC_USE_MOCKS;
});

/** --- RN / Expo mocks --- */

// Gesture Handler test setup (navigation/touchables)
try { require('react-native-gesture-handler/jestSetup'); } catch {}

// Silence native animated warnings + avoid crashes
try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {}

// Reanimated official mock
try {
  jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    // Patch .call to no-op (some libs expect it)
    Reanimated.default.call = () => {};
    return Reanimated;
  });
} catch {}

// Safe area mock
try {
  jest.mock('react-native-safe-area-context', () =>
    require('react-native-safe-area-context/jest/mock')
  );
} catch {}
