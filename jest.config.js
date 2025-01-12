export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/tests/**/*.ts', '**/?(*.)+test.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/packages'],
  setupFiles: ['<rootDir>/.jest/setup.js'],
}
