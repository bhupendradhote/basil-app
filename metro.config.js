// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 👇 Add this alias to fix react-native-web-webview resolution
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-web-webview': path.resolve(
    __dirname,
    'node_modules/react-native-webview'
  ),
};

module.exports = config;
