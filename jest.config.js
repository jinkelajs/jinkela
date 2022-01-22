/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverage: true,
  coverageDirectory: './coverage/',
  collectCoverageFrom: ['src/**/*.ts', '!src/example.ts', '!src/index.ts'],
};
