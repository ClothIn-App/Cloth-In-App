// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    linterOptions: {
      // "warn" by default in v9, but set explicitly if you like:
      reportUnusedDisableDirectives: "warn",
    }
  },
]);
