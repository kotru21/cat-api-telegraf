export default {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['js', 'mjs'],
  transform: {},
  testMatch: ['**/*.test.js'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupEnv.js'],
  moduleNameMapper: {
    '^/js/(.*)$': '<rootDir>/src/web/public/js/$1',
  },
};
