import * as fs from 'fs';
import * as path from 'path';

/**
 * The native OCR engine is loaded when a scan starts, never on import.
 *
 * `onnxruntime-react-native` installs its JSI binding the moment it is
 * imported. `useTextRecognition` sits below every IBAN field, so a module-level
 * import ran that installation whenever a form screen opened - and when it
 * failed on Android, the form screens crashed although nobody had asked for a
 * scan. Only type imports may stay at the top of the file.
 */
const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'hooks', 'useTextRecognition.tsx'), 'utf-8');
const NATIVE_ENGINE_MODULES = ['ppu-paddle-ocr', 'onnxruntime-react-native', '@shopify/react-native-skia'];

describe('useTextRecognition (native)', () => {
	it.each(NATIVE_ENGINE_MODULES)('does not import %s at module level', (moduleName) => {
		const valueImports = SOURCE.split('\n').filter((line) => /^\s*import\s/.test(line) && !/^\s*import\s+type\s/.test(line) && line.includes(`'${moduleName}`));
		expect(valueImports).toEqual([]);
	});
});
