// Regression tests for the Expo SDK 57 upload break: `expo/fetch` (the global `fetch` since
// SDK 57) builds the multipart body in JavaScript and rejects React Native's proprietary
// `{ uri, name, type }` form part with "Unsupported FormDataPart implementation".
// `isSupportedByExpoFetch` below mirrors the check in `expo/src/winter/fetch/convertFormData.ts`.

jest.mock('@/constants/Constants', () => ({ isWeb: false }));

jest.mock('repo-depkit-common-ui', () => ({ MyBuffer: require('buffer').Buffer }));

const cacheDirectory = 'file:///cache';

// Minimal stand-in for the `expo-file-system` `File`: it keeps the parts of the real class that
// `expo/fetch` relies on - `name`, `type` and `bytes()`.
class MockFileSystemFile {
	static writtenFiles: Record<string, Uint8Array> = {};

	public readonly uri: string;

	constructor(...uris: string[]) {
		this.uri = uris.join('/');
	}

	get name() {
		return this.uri.split('/').pop() ?? '';
	}

	get type() {
		return this.name.endsWith('.png') ? 'image/png' : 'image/jpeg';
	}

	create() {
		MockFileSystemFile.writtenFiles[this.uri] = new Uint8Array();
	}

	write(bytes: Uint8Array) {
		MockFileSystemFile.writtenFiles[this.uri] = bytes;
	}

	async bytes(): Promise<Uint8Array> {
		return MockFileSystemFile.writtenFiles[this.uri] ?? new Uint8Array();
	}
}

jest.mock('expo-file-system', () => ({
	File: MockFileSystemFile,
	Paths: { cache: cacheDirectory },
}));

type RecordedPart = [string, unknown, string?];

// React Native's `FormData` exposes its parts only through internals, jsdom's only through
// `entries()` - and neither keeps a non-`Blob` object intact. This stand-in records the
// `append` calls, which is all the assertions below need.
class RecordingFormData {
	public readonly parts: RecordedPart[] = [];

	append(name: string, value: unknown, fileName?: string) {
		this.parts.push([name, value, fileName]);
	}

	// `expo/fetch` reads the parts through `entries()`, exactly like the patched React Native
	// `FormData` provides them (see `expo/src/winter/FormData.ts`).
	entries(): [string, unknown][] {
		return this.parts.map(part => [part[0], part[1]]);
	}
}

/** The exact acceptance check `expo/fetch` performs for every form part. */
function isSupportedByExpoFetch(part: unknown): boolean {
	return typeof part === 'string' || part instanceof Blob || (typeof part === 'object' && part !== null && 'bytes' in part);
}

describe('fileUploadHelper', () => {
	let fileUploadHelper: typeof import('./fileUploadHelper');
	let originalFormData: typeof FormData;

	const getParts = (formData: FormData): RecordedPart[] => (formData as unknown as RecordingFormData).parts;
	const getFieldValue = (formData: FormData, name: string) => getParts(formData).find(part => part[0] === name)?.[1];
	const getFilePart = (formData: FormData) => getParts(formData).at(-1);

	beforeEach(() => {
		jest.resetModules();
		MockFileSystemFile.writtenFiles = {};
		originalFormData = global.FormData;
		global.FormData = RecordingFormData as unknown as typeof FormData;
		fileUploadHelper = require('./fileUploadHelper');
	});

	afterEach(() => {
		global.FormData = originalFormData;
	});

	it('appends a file part that expo/fetch can serialize instead of a { uri } object', async () => {
		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: 'file:///data/user/0/cache/ImageManipulator/abc-123.jpg',
			fileName: 'foods_42',
		});

		const filePart = getFilePart(formData);
		expect(filePart?.[0]).toBe('file');
		expect(isSupportedByExpoFetch(filePart?.[1])).toBe(true);
		// The React Native form part that SDK 57 rejects.
		expect(isSupportedByExpoFetch({ uri: 'file:///abc.jpg', name: 'foods_42.jpg', type: 'image/jpeg' })).toBe(false);
	});

	it('appends the file last, because Directus ignores payload fields sent after it', async () => {
		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: 'file:///cache/abc-123.jpg',
			fileName: 'foods_42',
			folderId: 'folder-uuid',
			title: 'foods_42',
		});

		const parts = getParts(formData);
		expect(parts.map(part => part[0])).toEqual(['folder', 'title', 'filename_download', 'type', 'file']);
	});

	it('adds the missing extension and the mime type to the uploaded file name', async () => {
		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: 'file:///cache/abc-123.jpg',
			fileName: 'foods_42',
		});

		expect(getFieldValue(formData, 'filename_download')).toBe('foods_42.jpg');
		expect(getFieldValue(formData, 'type')).toBe('image/jpeg');
	});

	it('keeps an extension that the file name already carries', async () => {
		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: 'file:///cache/abc-123.png',
			fileName: 'signature_1700000000.png',
		});

		expect(getFieldValue(formData, 'filename_download')).toBe('signature_1700000000.png');
		expect(getFieldValue(formData, 'type')).toBe('image/png');
	});

	it('writes a data uri (signature) into a cache file, since native cannot build a Blob from bytes', async () => {
		const base64 = Buffer.from('signature-bytes').toString('base64');

		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: `data:image/png;base64,${base64}`,
			fileName: 'signature_1700000000',
		});

		expect(getFieldValue(formData, 'filename_download')).toBe('signature_1700000000.png');
		expect(getFieldValue(formData, 'type')).toBe('image/png');

		const filePart = getFilePart(formData)?.[1] as MockFileSystemFile;
		expect(isSupportedByExpoFetch(filePart)).toBe(true);
		expect(Buffer.from(await filePart.bytes()).toString()).toBe('signature-bytes');
	});

	it('prefers the explicitly known mime type over the one derived from the uri', async () => {
		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: 'file:///cache/document-without-extension',
			fileName: 'report',
			mimeType: 'application/pdf',
		});

		expect(getFieldValue(formData, 'type')).toBe('application/pdf');
		expect(getFieldValue(formData, 'filename_download')).toBe('report.pdf');
	});

	it('is serialized by the real expo/fetch multipart conversion', async () => {
		// The code that threw "Unsupported FormDataPart implementation" in SDK 57.
		const { convertFormDataAsync } = require('expo/src/winter/fetch/convertFormData');
		const base64 = Buffer.from('signature-bytes').toString('base64');

		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: `data:image/png;base64,${base64}`,
			fileName: 'signature_1700000000',
			folderId: 'folder-uuid',
		});

		const { body } = await convertFormDataAsync(formData, 'TEST_BOUNDARY');
		const serializedBody = Buffer.from(body).toString();

		expect(serializedBody).toContain('content-disposition: form-data; name="file"; filename="signature_1700000000.png"');
		expect(serializedBody).toContain('content-type: image/png');
		expect(serializedBody).toContain('signature-bytes');
		expect(serializedBody).toContain('name="folder"');

		// ... while the form part the app built before this fix reproduces the reported error.
		const legacyFormData = new RecordingFormData();
		legacyFormData.append('image', { uri: 'file:///cache/abc-123.jpg', name: 'foods_42.jpg', type: 'image/jpg' });
		await expect(convertFormDataAsync(legacyFormData, 'TEST_BOUNDARY')).rejects.toThrow('Unsupported FormDataPart implementation');
	});

	it('omits the folder and title fields when they are not set', async () => {
		const formData = await fileUploadHelper.buildDirectusUploadFormData({
			uri: 'file:///cache/abc-123.jpg',
			fileName: 'foods_42',
			folderId: '',
		});

		expect(getParts(formData).map(part => part[0])).toEqual(['filename_download', 'type', 'file']);
	});
});
