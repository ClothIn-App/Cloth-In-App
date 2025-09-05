// jest.config.js
module.exports = {
  projects: [
    // --- APP (pure RN component tests; no Expo runtime) ---
    {
      displayName: 'app',
      preset: 'react-native',
      testMatch: ['<rootDir>/tests/app/**/*.test.ts?(x)'],
      // No Winter setup here
      setupFilesAfterEnv: ['<rootDir>/tests/setupAppTests.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
      },
      // Ensure RN deps are transformed
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|react-native-reanimated|react-native-gesture-handler|@react-navigation)/)',
      ],
      clearMocks: true,
    },

    // --- ENDPOINTS (node/ts-jest) ---
    {
      displayName: 'endpoints',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/endpoints/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupEndpointTests.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { isolatedModules: true } }],
      },
      clearMocks: true,
    },
  ],
};
