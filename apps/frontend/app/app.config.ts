import type { ConfigContext } from '@expo/config';

// Register ts-node so Expo can load TypeScript config helpers without a
// precompiled JavaScript file.
require('ts-node').register({
	transpileOnly: true,
	compilerOptions: {
		module: 'Node16',
		moduleResolution: 'node16',
	},
});

const { getFinalConfig } = require('./config.ts');
const { collectLicenses } = require('repo-depkit-common/licenses/collectLicenses.ts');

module.exports = function getExpoConfig({ config }: ConfigContext) {
	// Open-source dependency versions of this app and of its workspace
	// packages (repo-depkit-common, repo-depkit-common-ui), collected from
	// node_modules at config-evaluation time (expo start / export / build /
	// update). Read at runtime via Constants.expoConfig.extra.licenses.
	// Collected here (Node-only context) rather than in config.ts, which is
	// also bundled into the app itself and must stay free of Node built-ins.
	return getFinalConfig(config, collectLicenses(__dirname));
};
