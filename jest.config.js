export default {
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["babel-jest", { presets: ["@babel/preset-typescript"] }],
  },
  // Los imports usan .js porque ese será el formato del código compilado.
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
