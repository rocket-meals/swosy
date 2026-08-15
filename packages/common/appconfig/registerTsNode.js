// Registers ts-node so Expo can evaluate the TypeScript config helpers of an
// app (its config.ts, this package's appconfig/*.ts) without a precompiled
// JavaScript file.
//
// Plain JavaScript on purpose: it runs BEFORE ts-node is hooked into the
// require pipeline, so it cannot be a .ts file itself. Every app.config.ts
// calls this first, then requires its TypeScript helpers:
//
//   require('repo-depkit-common/appconfig/registerTsNode.js').registerTsNode();
//   const { getExpoBuildPropertiesPlugin } = require('repo-depkit-common/appconfig/expoAppConfig.ts');
//
// Node-only - never import this from app/runtime code.

function registerTsNode() {
	require('ts-node').register({
		transpileOnly: true,
		compilerOptions: {
			module: 'Node16',
			moduleResolution: 'node16',
		},
	});
}

module.exports = { registerTsNode };
