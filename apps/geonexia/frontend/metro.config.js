const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../../..');

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	// Ensure Metro watches the entire monorepo so workspace packages
	// (e.g. packages/common-ui) and their assets are picked up correctly.
	config.watchFolders = [monorepoRoot];

	// Provide empty stubs for Node.js built-ins required by vendored
	// emscripten/asm.js files (e.g. helpers/h3/libh3.js). Those require()
	// calls are guarded by ENVIRONMENT_IS_NODE checks and never execute on
	// device, but Metro's static analyser still tries to resolve them.
	config.resolver.extraNodeModules = {
		...config.resolver.extraNodeModules,
		fs: require.resolve('./emptyModule.js'),
		path: require.resolve('./emptyModule.js'),
	};

	return config;
})();
