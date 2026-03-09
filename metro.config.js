const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resetCache = false;

// Corrige "Cannot use 'import.meta' outside a module" no web (Zustand e outros ESM)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
