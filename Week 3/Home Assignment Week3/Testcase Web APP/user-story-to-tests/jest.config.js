module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/frontend/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.ts'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/frontend/tsconfig.json',
    },
  },
};
