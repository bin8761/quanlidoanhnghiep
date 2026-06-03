module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  collectCoverage: false,
};
