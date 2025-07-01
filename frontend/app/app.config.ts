import type { ConfigContext } from "@expo/config";

// Register ts-node so Expo can load TypeScript config helpers without a
// precompiled JavaScript file.
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});

const { getFinalConfig } = require("./config.ts");

module.exports = function ({ config }: ConfigContext) {
  return getFinalConfig(config);
};
