/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  setupFiles: ["<rootDir>/../test/jest.setup.ts"],
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.module.ts",
    "!**/dto.ts",
    "!main.ts",
  ],
  coverageDirectory: "../coverage",
  // ts-jest with isolatedModules: faster, skips full type-check (tsc covers that).
  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },
};
