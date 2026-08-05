const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const monorepoRoot = path.resolve(__dirname, '../../..');

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	// Refresh the open-source license list on every bundler start so the
	// settings screen always shows the currently installed dependency
	// versions of this app and its workspace packages (common, common-ui).
	require(path.join(monorepoRoot, 'packages/common/licenses/collectLicenses.cjs')).writeLicenseFile({
		appDir: __dirname,
		outputPath: path.join(__dirname, 'constants/licenses.generated.ts'),
	});

	// Ensure Metro watches the entire monorepo so workspace packages
	// (e.g. packages/common-ui) and their assets are picked up correctly.
	config.watchFolders = [monorepoRoot];

	return config;
})();
