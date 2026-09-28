import { Asset } from 'expo-asset';
import { Directory, File, Paths } from 'expo-file-system';

import { buildPageHtml } from './buildPageHtml';

/**
 * Where the composed page lives, and how the app gets it there.
 *
 * The page bundle, onnxruntime's WebAssembly and the three model files ship
 * with the app as Metro assets. At first use they are read off the device,
 * base64-encoded where the page needs bytes, and written into one HTML file in
 * the cache directory (see `buildPageHtml`). The file is named after the
 * assets' hashes, so an update that changes any of them composes a new page
 * and the old one is thrown away; the same version is composed once and then
 * only reused.
 */

/** The folder below the cache directory; nothing else lives in it. */
const PAGE_DIRECTORY_NAME = 'text-recognition';

/**
 * The engine's files, as Metro assets.
 *
 * Resolved when first needed rather than at import time, so that a `require`
 * that fails takes down the scan that wanted it and not the screen that merely
 * imported this module.
 */
const loadAssetModules = () => ({
	bundle: require('@/public/paddleocr/text-recognition-page.webviewjs') as number,
	wasm: require('@/public/paddleocr/ort-wasm-simd-threaded.wasm') as number,
	detection: require('@/public/paddleocr/PP-OCRv6_tiny_det.ort') as number,
	recognition: require('@/public/paddleocr/PP-OCRv6_tiny_rec.ort') as number,
	dictionary: require('@/public/paddleocr/ppocrv6_tiny_dict.txt') as number,
});

/** Where the page ended up, in the form the WebView wants it. */
export interface PreparedPageFile {
	/** The `file://` URI of the HTML document. */
	uri: string;
	/** The directory it is in; WebKit needs to be told it may read from there. */
	directoryUri: string;
}

/**
 * Reads one bundled asset off the device. `downloadAsync` is what turns an
 * Android resource into a real file; on every other platform and for every
 * asset an update brought along it is a no-op.
 */
const openAsset = async (assetModule: number): Promise<{ asset: Asset; file: File }> => {
	const asset = Asset.fromModule(assetModule);
	await asset.downloadAsync();
	if (!asset.localUri) {
		throw new Error(`${asset.name} has no local copy on this device`);
	}
	return { asset, file: new File(asset.localUri) };
};

/** Composes the page if this version of it does not exist yet, and returns where it is. */
export const preparePageFile = async (): Promise<PreparedPageFile> => {
	const modules = loadAssetModules();
	const [bundle, wasm, detection, recognition, dictionary] = await Promise.all([openAsset(modules.bundle), openAsset(modules.wasm), openAsset(modules.detection), openAsset(modules.recognition), openAsset(modules.dictionary)]);

	const directory = new Directory(Paths.cache, PAGE_DIRECTORY_NAME);
	directory.create({ idempotent: true, intermediates: true });

	// Eight characters of each hash: distinct enough between versions, short
	// enough for a file name.
	const version = [bundle, wasm, detection, recognition, dictionary].map(({ asset }) => (asset.hash ?? asset.name).slice(0, 8)).join('-');
	const pageFile = new File(directory, `page-${version}.html`);
	if (pageFile.exists) {
		return { uri: pageFile.uri, directoryUri: directory.uri };
	}

	// Anything else in here is a page of an earlier version.
	for (const entry of directory.list()) {
		entry.delete();
	}

	const html = buildPageHtml(await bundle.file.text(), {
		wasm: await wasm.file.base64(),
		detection: await detection.file.base64(),
		recognition: await recognition.file.base64(),
		dictionary: await dictionary.file.base64(),
	});
	pageFile.write(html);
	return { uri: pageFile.uri, directoryUri: directory.uri };
};
