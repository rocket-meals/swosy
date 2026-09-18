const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	const { transformer, resolver } = config;

	config.transformer = {
		...transformer,
		babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
	};
	// The bundled text recognition models (public/paddleocr): the two .ort
	// networks and the character dictionary beside them.
	const engineAssetExts = ['ort', 'txt'];

	// onnxruntime-web is served as a plain script instead of being bundled: its
	// published bundles call import(someVariable) for their WebAssembly loader,
	// and Metro fails the whole web build on a dynamic import it cannot follow.
	// See helper/onnxruntimeFromPage.js.
	const onnxruntimeFromPage = path.resolve(__dirname, 'helper/onnxruntimeFromPage.js');

	config.resolver = {
		...resolver,
		assetExts: [...new Set([...resolver.assetExts.filter(ext => ext !== 'svg'), ...engineAssetExts])],
		sourceExts: [...resolver.sourceExts, 'svg'],
		resolveRequest: (context, moduleName, platform) => {
			if (platform === 'web' && moduleName === 'onnxruntime-web') {
				return { type: 'sourceFile', filePath: onnxruntimeFromPage };
			}
			return context.resolveRequest(context, moduleName, platform);
		},
	};

	return config;
})();
