/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testTimeout: 15000,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testMatch: ['**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.maestro/'],
  setupFiles: ['<rootDir>/jest-global-setup.js'],
  transform: {
    // Use jest caller (not metro) so babel-preset-expo doesn't activate Metro's
    // module resolver, which would resolve 'msw' imports to absolute TS source
    // paths at transform time (bypassing moduleNameMapper).
    '\\.[jt]sx?$': ['babel-jest', { caller: { name: 'jest', bundler: 'jest' } }],
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@gorhom/.*|react-native-reanimated|msw|@mswjs/.*|rettime|until-async|headers-polyfill|is-node-process|outvariant|strict-event-emitter|@open-draft/.*)',
  ],
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    // Redirect MSW to its prebuilt CJS output to avoid babel-preset-expo
    // transforming MSW's TypeScript source (which contains import.meta usage
    // that would trigger Expo's __ExpoImportMetaRegistry polyfill outside of
    // test code scope, causing a ReferenceError in jest-runtime).
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    '^@gorhom/bottom-sheet$': '<rootDir>/__mocks__/@gorhom/bottom-sheet.tsx',
    '^@react-native-community/datetimepicker$': '<rootDir>/__mocks__/@react-native-community/datetimepicker.tsx',
    '^@/config$': '<rootDir>/src/__mocks__/config.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/__mocks__/**',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!app/**',
    '!components/ui/**',
    // Native integration wrappers — require device APIs, not unit-testable
    '!src/config.ts',
    '!src/features/auth/AuthProvider.tsx',
    '!src/features/auth/BiometricGate.tsx',
    '!src/services/queryClient.ts',
    '!src/services/validation.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
