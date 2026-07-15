import { File, Paths } from 'expo-file-system';

// expo-sqlite's web build needs Metro wasm config plus COOP/COEP response headers
// (for SharedArrayBuffer/OPFS) that these apps' static web exports don't set up, so web
// keeps using expo-file-system - the same mechanism these apps already used for every
// platform before this migration, and it already ships its own official web
// implementation, so nothing changes behaviorally here. Metro picks this file over
// SqliteKeyValueStorage.ts for web builds, so expo-sqlite's wasm-dependent web module is
// never pulled into the web bundle.

function getFile(key: string): File {
	return new File(Paths.document, `${key}.json`);
}

// dbName is accepted (and ignored) for signature parity with SqliteKeyValueStorage.ts -
// each key is already isolated as its own file here, there's no shared "db" to name.
export async function getStorageItem(key: string, dbName?: string): Promise<string | null> {
	const file = getFile(key);
	if (!file.exists) return null;
	return await file.text();
}

export async function setStorageItem(key: string, value: string, dbName?: string): Promise<void> {
	getFile(key).write(value);
}

export async function removeStorageItem(key: string, dbName?: string): Promise<void> {
	const file = getFile(key);
	if (file.exists) file.delete();
}
