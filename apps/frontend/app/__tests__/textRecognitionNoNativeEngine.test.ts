import * as fs from 'fs';
import * as path from 'path';

/**
 * The text recognition engine is WebAssembly on every platform, never a native
 * module.
 *
 * The native onnxruntime binding crashed the app on Android — first whenever a
 * form with an IBAN field opened, because it installed itself on import, then
 * on the first scan once that import was deferred. The engine now runs in a
 * WebView on a device, on the same WebAssembly build the browser uses, and no
 * source file may reach for the native modules again. `config.ts` is allowed
 * to name them: it records why build numbers were raised.
 */
const APP_DIRECTORY = path.join(__dirname, '..');
const NATIVE_ENGINE_MODULES = ['onnxruntime-react-native', 'ppu-paddle-ocr/mobile', '@shopify/react-native-skia'];
const SOURCE_DIRECTORIES = ['app', 'components', 'helper', 'hooks', 'redux', 'constants', 'context'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const listSourceFiles = (directory: string): string[] => {
	const files: string[] = [];
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== 'node_modules') {
				files.push(...listSourceFiles(entryPath));
			}
		} else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
			files.push(entryPath);
		}
	}
	return files;
};

const sourceFiles = SOURCE_DIRECTORIES.flatMap((directory) => listSourceFiles(path.join(APP_DIRECTORY, directory)));

describe('the text recognition engine', () => {
	it('scans a meaningful number of source files', () => {
		expect(sourceFiles.length).toBeGreaterThan(100);
	});

	it.each(NATIVE_ENGINE_MODULES)('is never loaded through %s', (moduleName) => {
		const offenders = sourceFiles.filter((file) => {
			const source = fs.readFileSync(file, 'utf-8');
			return source.includes(`'${moduleName}`) || source.includes(`"${moduleName}`);
		});
		expect(offenders.map((file) => path.relative(APP_DIRECTORY, file))).toEqual([]);
	});

	it('runs in the WebView the root layout hosts', () => {
		const layout = fs.readFileSync(path.join(APP_DIRECTORY, 'app', '_layout.tsx'), 'utf-8');
		expect(layout).toMatch(/<TextRecognitionWebViewHost \/>/);
	});
});
