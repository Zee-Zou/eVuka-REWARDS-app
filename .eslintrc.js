module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.js"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    // React refresh - keep as warn for development flexibility
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],

    // Hooks - enforce proper dependencies (error in production)
    "react-hooks/exhaustive-deps": "error",

    // TypeScript - strict type safety (all errors)
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }
    ],

    // Additional strict TypeScript rules
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",

    // Prevent common errors
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "error",

    // Code quality
    "eqeqeq": ["error", "always"],
    "no-var": "error",
    "prefer-const": "error",
    "prefer-arrow-callback": "error",
  },
};
