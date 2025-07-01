import type { ConfigContext } from "@expo/config";
const { getFinalConfig } = require("./expo-config.js");

module.exports = function ({ config }: ConfigContext) {
    return getFinalConfig(config);
};
