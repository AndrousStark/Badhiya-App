// Metro configuration for Badhiya mobile app.
// https://docs.expo.dev/guides/customizing-metro/

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle ORM needs to import .sql migration files at runtime.
config.resolver.sourceExts.push('sql');

// Legend State sync engines occasionally ship .cjs
config.resolver.sourceExts.push('cjs');

module.exports = config;
