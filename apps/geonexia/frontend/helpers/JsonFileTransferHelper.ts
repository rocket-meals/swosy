import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

/**
 * File based JSON export/import. Export codes (activities, routes, map
 * settings) can easily exceed what the clipboard handles comfortably, so
 * instead of copying/pasting raw JSON the data is written to and read from
 * .json files.
 */

export type SaveJsonResult = 'saved' | 'shared' | 'cancelled';

/**
 * Saves a JSON string as a file.
 *
 * - Web: triggers a regular browser download.
 * - Android: lets the user pick a target directory (Storage Access
 *   Framework) and writes the file there.
 * - iOS: writes the file to the app cache and opens the share sheet, which
 *   offers "Save to Files" alongside the usual share targets.
 */
export async function saveJsonToFile(json: string, filename: string): Promise<SaveJsonResult> {
	if (Platform.OS === 'web') {
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		try {
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = filename;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
		} finally {
			URL.revokeObjectURL(url);
		}
		return 'saved';
	}

	if (Platform.OS === 'android') {
		const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
		if (!permission.granted) return 'cancelled';
		const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
			permission.directoryUri,
			filename,
			'application/json',
		);
		await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
		return 'saved';
	}

	const fileUri = `${FileSystem.cacheDirectory}${filename}`;
	await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
	const result = await Share.share({ url: fileUri });
	return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
}

/**
 * Opens the system document picker and returns the text content of the
 * selected file, or null when the user cancels. The type filter is kept wide
 * because Android file managers often report .json files with generic mime
 * types, which would grey them out under a strict 'application/json' filter.
 */
export async function pickJsonFromFile(): Promise<string | null> {
	const result = await DocumentPicker.getDocumentAsync({
		type: ['application/json', 'text/plain', 'application/octet-stream', '*/*'],
		copyToCacheDirectory: true,
		multiple: false,
	});
	if (result.canceled || result.assets.length === 0) return null;
	const asset = result.assets[0];

	if (Platform.OS === 'web') {
		if (asset.file) return await asset.file.text();
		const response = await fetch(asset.uri);
		return await response.text();
	}

	return await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

/** Builds a dated filename like `geonexia-activities-2026-07-19.json`. */
export function buildJsonExportFilename(base: string): string {
	const d = new Date();
	const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	return `${base}-${date}.json`;
}
