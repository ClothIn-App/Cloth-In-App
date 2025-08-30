// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'endpoints',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/endpoints/**/*.(test|spec).ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
      clearMocks: true,
    },
    {
      displayName: 'app',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/app/**/*.(test|spec).(ts|tsx)'],
      setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
      },
      // ← no transformIgnorePatterns here (let jest-expo handle it)
      clearMocks: true,
    },
  ],
};
