// tests/setupAppTests.ts
import '@testing-library/jest-native/extend-expect';

(global as any).__DEV__ = true;

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
try {
  const ra = require('react-native-reanimated');
  if (typeof ra.setUpTests === 'function') ra.setUpTests();
} catch {}

try {
  jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
} catch {}

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock')
);

jest.mock('react-native-gesture-handler', () => ({}));

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  jest.clearAllMocks();
});
