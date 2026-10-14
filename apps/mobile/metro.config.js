const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const reactNativePkgPath = path.dirname(
  require.resolve('react-native/package.json'),
);
const reactNativeFeatureFlagsPath = path.join(
  reactNativePkgPath,
  'src/private/featureflags/ReactNativeFeatureFlags.js',
);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // Workaround for upstream React Native 0.87 issue where @react-native/virtualized-lists
      // imports an internal subpath not explicitly exposed in react-native's package.json exports.
      if (
        moduleName ===
        'react-native/src/private/featureflags/ReactNativeFeatureFlags'
      ) {
        return {
          filePath: reactNativeFeatureFlagsPath,
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
