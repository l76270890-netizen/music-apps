const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite loads its WebAssembly bundle as a static asset on web.
config.resolver.assetExts.push('wasm');

module.exports = config;
