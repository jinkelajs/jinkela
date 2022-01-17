/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: 'reports',
  collectCoverageFrom: ['src/**/*.ts', '!src/example.ts', '!src/index.ts'],
  coverageReporters: ['clover', 'html'],
};
