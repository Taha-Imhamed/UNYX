import nextConfig from "eslint-config-next"

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "playwright-report/**", "test-results/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      // This app doesn't opt into React Compiler (no babel-plugin-react-compiler,
      // no next.config `experimental.reactCompiler`), so its static-analysis rules
      // (bundled by default in eslint-config-next 16's react-hooks preset) flag the
      // codebase's standard fetch-in-effect data-loading pattern as if it were a
      // Compiler-target violation. Not applicable without opting into the Compiler.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
      // images.unoptimized is true (next.config.mjs), so next/image has no
      // optimization benefit here — plain <img> is fine.
      "@next/next/no-img-element": "off",
      // Intentional full-page reload to clear all client state on auth failure,
      // not a Next internal-route navigation.
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
]

export default eslintConfig
