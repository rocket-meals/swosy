// ─── Own image for a game ─────────────────────────────────────────────────────
//
// Besides picking a searched picture (whose URL is stored, see ImageSearch), a
// game can carry an image the user supplies themselves. That one has no URL to
// point at, so it is stored inline as a `data:` URI - which means it has to be
// made small first: everything is scaled down to `MAX_IMAGE_SIZE` and
// re-encoded as JPEG before it ever reaches the store, so a game costs a few
// dozen KB rather than the several MB a phone camera produces.

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/** Longest edge of a stored image, in pixels. Large enough for the biggest preview (a 56pt circle at 3x). */
export const MAX_IMAGE_SIZE = 512;

/** JPEG quality of a stored image - visually fine at preview size, and keeps the data URI small. */
const IMAGE_QUALITY = 0.7;

export type PickImageSource = 'library' | 'camera';

/**
 * Thrown when the picker's native module isn't part of the installed app yet.
 * `expo-image-picker`/`expo-image-manipulator` ship native code, so they only
 * become usable with a new native build - an OTA update alone carries the
 * JavaScript but not the module behind it. Callers turn this into a hint
 * rather than letting it surface as a crash.
 */
export class ImagePickerUnavailableError extends Error {
	constructor() {
		super('Eigene Bilder sind erst nach dem nächsten nativen App-Update verfügbar.');
		this.name = 'ImagePickerUnavailableError';
	}
}

/** True for the "native module missing" failure, as opposed to a real error. */
function isMissingNativeModule(err: unknown): boolean {
	const message = err instanceof Error ? err.message : String(err);
	return /native module|not available|doesn't exist|cannot find module/i.test(message);
}

/**
 * Scale the picked image down so its longest edge is at most `MAX_IMAGE_SIZE`,
 * keeping the aspect ratio. Images that are already small are left as they are
 * (they still get re-encoded, which is what produces the base64 payload).
 */
function resizeAction(width: number, height: number): ImageManipulator.Action[] {
	const longestEdge = Math.max(width, height);
	if (longestEdge <= MAX_IMAGE_SIZE || longestEdge === 0) return [];
	const scale = MAX_IMAGE_SIZE / longestEdge;
	return [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }];
}

/**
 * Let the user pick (or shoot) an image and return it as a `data:` URI, ready
 * to be stored on a game. Returns `null` when the user cancels or denies the
 * permission - both are normal outcomes, not errors.
 */
export async function pickGameImageAsDataUri(source: PickImageSource): Promise<string | null> {
	try {
		return await runPicker(source);
	} catch (err) {
		if (isMissingNativeModule(err)) throw new ImagePickerUnavailableError();
		throw err;
	}
}

async function runPicker(source: PickImageSource): Promise<string | null> {
	const permission =
		source === 'camera'
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!permission.granted) return null;

	const options: ImagePicker.ImagePickerOptions = {
		mediaTypes: ['images'],
		allowsEditing: true,
		aspect: [1, 1],
		allowsMultipleSelection: false,
		selectionLimit: 1,
		quality: 1,
	};
	const result =
		source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
	if (result.canceled) return null;

	const asset = result.assets[0];
	if (!asset?.uri) return null;

	const manipulated = await ImageManipulator.manipulateAsync(asset.uri, resizeAction(asset.width ?? 0, asset.height ?? 0), {
		compress: IMAGE_QUALITY,
		format: ImageManipulator.SaveFormat.JPEG,
		base64: true,
	});
	if (!manipulated.base64) return null;
	return `data:image/jpeg;base64,${manipulated.base64}`;
}

/** True for an image stored inline (own upload) rather than referenced by URL. */
export function isInlineImage(imageUrl: string | null | undefined): boolean {
	return typeof imageUrl === 'string' && imageUrl.startsWith('data:');
}

/** Rough size of a stored image, for the "eigenes Bild (43 KB)" hint in the picker. */
export function describeImageSize(imageUrl: string): string {
	// base64 carries 3 bytes per 4 characters.
	const base64Length = imageUrl.length - (imageUrl.indexOf(',') + 1);
	const kilobytes = Math.round((base64Length * 3) / 4 / 1024);
	return `${kilobytes} KB`;
}
