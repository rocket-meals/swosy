const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	const { transformer, resolver } = config;

	config.transformer = {
		...transformer,
		babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
	};
	// txt/gz/wasm carry the bundled text recognition engine (public/tesseract).
	// Metro would otherwise treat the engine's own .js files as source code, so
	// they are shipped as .txt copies - see public/tesseract/README.md.
	const engineAssetExts = ['txt', 'gz', 'wasm'];

	config.resolver = {
		...resolver,
		assetExts: [...new Set([...resolver.assetExts.filter(ext => ext !== 'svg'), ...engineAssetExts])],
		sourceExts: [...resolver.sourceExts, 'svg'],
	};

	return config;
})();
