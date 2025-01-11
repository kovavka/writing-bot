/** @type {import('eslint').Linter.Config} */
export default {
  // parser: '@typescript-eslint/parser',
  // parserOptions: {
  //   ecmaVersion: 2020,
  //   sourceType: 'module',
  //   ecmaFeatures: {
  //     jsx: true,
  //   },
  // },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // General
    'no-console': 'warn',
    'no-unused-vars': 'off', // Turned off in favor of @typescript-eslint/no-unused-vars
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // TypeScript-specific
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'warn',

    // Prettier integration
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        trailingComma: 'all',
      },
    ],
  },
}
