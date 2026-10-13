import { Platform } from 'react-native';

export class FontHelper {
	/**
	 * Monospace font installed on every device, nothing bundled or loaded from a CDN.
	 * The generic `monospace` only exists on Android and web: on iOS an unknown family falls back
	 * to the normal system font (San Francisco), so iOS uses Menlo, which ships with every iOS.
	 */
	static getMonospaceFontFamily(): string {
		return Platform.select({ ios: 'Menlo', default: 'monospace' });
	}
}
