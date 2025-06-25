module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    // Basic rules for code quality
    'no-console': 'off', // Allow console.log for pipeline logging
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off', // Disable for TypeScript
    'no-undef': 'off', // Disable for TypeScript
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    'tests/',
  ],
};
