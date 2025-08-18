// tests/setupTests.ts
// Runs before every test file
// Keep timers real unless a test chooses to fake them
afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules(); // important: re-imports will re-read process.env
  delete (global as any).fetch;
  // Clean potentially sticky envs:
  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
});
