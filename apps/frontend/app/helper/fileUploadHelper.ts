import { File as FileSystemFile, Paths } from 'expo-file-system';
import { StringHelper } from 'repo-depkit-common';
import { MyBuffer } from 'repo-depkit-common-ui';
import { isWeb } from '@/constants/Constants';

/**
 * Building the multipart body for a Directus `/files` upload.
 *
 * Since Expo SDK 57 the global `fetch` is `expo/fetch` (see `expo/src/winter/runtime.native.ts`),
 * which assembles the multipart body in JavaScript instead of handing the `FormData` to React
 * Native's networking layer. `expo/fetch` only understands form parts that carry their own bytes -
 * a string, a `Blob`, or an object with a `bytes()` method - and throws
 * `Unsupported FormDataPart implementation` for React Native's proprietary
 * `{ uri, name, type }` file part (see `expo/src/winter/fetch/convertFormData.ts`).
 *
 * Therefore every upload has to append a real payload:
 * - web: a `Blob` read from the picked object/data uri,
 * - native: an `expo-file-system` `File`, which implements `Blob` and exposes `bytes()`.
 */

const DATA_URI_PREFIX = 'data:';
const DEFAULT_FILE_EXTENSION = 'jpg';
const DEFAULT_MIME_TYPE = 'application/octet-stream';

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	heic: 'image/heic',
	heif: 'image/heif',
	pdf: 'application/pdf',
};

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp',
	'image/heic': 'heic',
	'image/heif': 'heif',
	'application/pdf': 'pdf',
};

/**
 * A form part that carries its own bytes and is therefore accepted by `expo/fetch`.
 * `FileSystemFile` is not a `Blob` subclass, it only implements the interface.
 */
export type UploadFilePart = Blob | FileSystemFile;

export type DirectusUploadFormDataOptions = {
	/** Local uri of the file: a `file://`/`content://` uri on native, an object/data uri on web. */
	uri: string;
	/** Name of the uploaded file. The extension is added when it is missing. */
	fileName: string;
	/** Id of the Directus folder the file should be stored in. */
	folderId?: string | null;
	/** Mime type of the file, derived from the uri when omitted. */
	mimeType?: string | null;
	/** Title stored on the Directus file. */
	title?: string | null;
};

function isDataUri(uri: string): boolean {
	return uri.startsWith(DATA_URI_PREFIX);
}

function getMimeTypeFromDataUri(dataUri: string): string | null {
	const separatorIndex = dataUri.indexOf(',');
	if (separatorIndex < 0) {
		return null;
	}
	// "data:image/png;base64," -> "image/png"
	const header = dataUri.slice(DATA_URI_PREFIX.length, separatorIndex);
	const mimeType = header.split(';')[0];
	return mimeType ? mimeType.toLowerCase() : null;
}

function getExtensionFromMimeType(mimeType: string | null | undefined): string | null {
	if (!mimeType) {
		return null;
	}
	const normalizedMimeType = mimeType.toLowerCase();
	const knownExtension = EXTENSION_BY_MIME_TYPE[normalizedMimeType];
	if (knownExtension) {
		return knownExtension;
	}
	const subtype = normalizedMimeType.split('/')[1];
	return subtype && /^[a-z0-9]{1,5}$/.test(subtype) ? subtype : null;
}

/**
 * Extension of the given uri or file name, without the leading dot. `null` when there is none.
 */
export function getFileExtension(uriOrFileName: string): string | null {
	if (isDataUri(uriOrFileName)) {
		return getExtensionFromMimeType(getMimeTypeFromDataUri(uriOrFileName));
	}
	const withoutQuery = uriOrFileName.split('?')[0] ?? uriOrFileName;
	const withoutFragment = withoutQuery.split('#')[0] ?? withoutQuery;
	const lastSegment = withoutFragment.split('/').pop() ?? '';
	const dotIndex = lastSegment.lastIndexOf('.');
	if (dotIndex <= 0) {
		return null;
	}
	const extension = lastSegment.slice(dotIndex + 1).toLowerCase();
	return /^[a-z0-9]{1,5}$/.test(extension) ? extension : null;
}

/**
 * Mime type for the file behind the uri: the explicitly known one, otherwise derived
 * from the data uri header or from the file extension.
 */
export function resolveMimeType(uri: string, mimeType?: string | null): string {
	if (mimeType) {
		return mimeType;
	}
	if (isDataUri(uri)) {
		return getMimeTypeFromDataUri(uri) ?? DEFAULT_MIME_TYPE;
	}
	const extension = getFileExtension(uri);
	return (extension ? MIME_TYPE_BY_EXTENSION[extension] : null) ?? DEFAULT_MIME_TYPE;
}

/**
 * File name that always carries an extension, so that Directus stores a downloadable
 * file name instead of an extension-less one.
 */
export function resolveFileNameWithExtension(fileName: string, uri: string, mimeType?: string | null): string {
	if (getFileExtension(fileName)) {
		return fileName;
	}
	const extension = getFileExtension(uri) ?? getExtensionFromMimeType(resolveMimeType(uri, mimeType)) ?? DEFAULT_FILE_EXTENSION;
	return `${fileName}.${extension}`;
}

function sanitizeFileName(fileName: string): string {
	return StringHelper.replaceAllLiteralWithOptions({ str: fileName, find: '/', replace: '_' });
}

async function readBlobFromUri(uri: string): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.onload = () => resolve(xhr.response);
		xhr.onerror = () => reject(new TypeError(`Could not read the file at ${uri}`));
		xhr.responseType = 'blob';
		xhr.open('GET', uri, true);
		xhr.send(null);
	});
}

/**
 * Writes the payload of a data uri (for example a signature drawn in the app) into a cache
 * file, because native has no way to build a `Blob` from raw bytes.
 */
function writeDataUriToCacheFile(dataUri: string, fileNameWithExtension: string): FileSystemFile {
	const base64Content = dataUri.slice(dataUri.indexOf(',') + 1);
	const bytes = new Uint8Array(MyBuffer.from(base64Content, 'base64'));

	const file = new FileSystemFile(Paths.cache, sanitizeFileName(fileNameWithExtension));
	file.create({ overwrite: true, intermediates: true });
	file.write(bytes);
	return file;
}

/**
 * Creates the form part for the file behind the given uri.
 */
export async function createUploadFilePart(uri: string, fileNameWithExtension: string): Promise<UploadFilePart> {
	if (isWeb) {
		return readBlobFromUri(uri);
	}
	if (isDataUri(uri)) {
		return writeDataUriToCacheFile(uri, fileNameWithExtension);
	}
	return new FileSystemFile(uri);
}

/**
 * Builds the `FormData` for a Directus `/files` upload.
 *
 * Directus applies only those payload fields that it has already read when it reaches the file
 * part, so every metadata field is appended *before* the file.
 */
export async function buildDirectusUploadFormData(options: DirectusUploadFormDataOptions): Promise<FormData> {
	const { uri, fileName, folderId, mimeType, title } = options;

	const resolvedMimeType = resolveMimeType(uri, mimeType);
	const fileNameWithExtension = resolveFileNameWithExtension(fileName, uri, resolvedMimeType);
	const filePart = await createUploadFilePart(uri, fileNameWithExtension);

	const formData = new FormData();
	if (folderId) {
		formData.append('folder', folderId);
	}
	if (title) {
		formData.append('title', title);
	}
	formData.append('filename_download', fileNameWithExtension);
	formData.append('type', resolvedMimeType);
	// Directus reads the uploaded file from the file part regardless of the field name.
	formData.append('file', filePart as Blob, fileNameWithExtension);

	return formData;
}
