const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const monorepoRoot = path.resolve(__dirname, '../../..');

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	// Refresh the open-source license list whenever Metro bundles the app
	// (expo start / expo export / EAS build / EAS update) so the settings
	// screen always shows the currently installed dependency versions of
	// this app and its workspace packages (common, common-ui).
	try {
		const tsNode = require('ts-node').register({ transpileOnly: true, skipProject: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node' } });
		require(path.join(monorepoRoot, 'packages/common/licenses/collectLicenses.ts')).writeLicenseFile({
			appDir: __dirname,
			outputPath: path.join(__dirname, 'constants/licenses.generated.ts'),
		});
		tsNode.enabled(false);
	} catch (error) {
		console.warn('[metro.config] Could not refresh the license list:', error);
	}

	// Ensure Metro watches the entire monorepo so workspace packages
	// (e.g. packages/common-ui) and their assets are picked up correctly.
	config.watchFolders = [monorepoRoot];

	return config;
})();
