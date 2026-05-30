export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./test/setup.js"],
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js"],
  verbose: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
    "!utils/logger.js"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"]
};
