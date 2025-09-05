// Runs before every "endpoints" test file (pure Node/HTTP layer)

// Keep timers real unless a test fakes them deliberately
afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules(); // OK here: pure Node tests want fresh env per test
  delete (global as any).fetch;

  // Clean sticky envs used by http.ts:
  delete process.env.EXPO_PUBLIC_API_MODE;
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_MOCK_ROUTES;
  delete process.env.EXPO_PUBLIC_MOCK_LATENCY_MS;
});

// Quiet logs
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
