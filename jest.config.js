module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest", // Let babel-jest handle JS/TS/JSX/TSX files
  },
  transformIgnorePatterns: [
    "/node_modules/(?!axios)/", // <-- THIS tells Jest to transform axios (ESM) with Babel
  ],
};
