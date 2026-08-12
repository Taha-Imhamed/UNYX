export default {
  testEnvironment: 'node',
  // Treat JS/TS as ESM in this ESM package
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '\\.tsx?$': '<rootDir>/jest.esbuild-transform.js',
  },
  // Source imports use explicit ".js" extensions (required for native ESM),
  // but the files on disk are ".ts" — map them back for Jest's resolver.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/tests/**/*.test.[jt]s', '**/tests/**/*.test.ts'],
}
