export default {
  testEnvironment: 'node',
  // Treat JS/TS as ESM in this ESM package
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {},
  testMatch: ['**/tests/**/*.test.[jt]s'],
}
