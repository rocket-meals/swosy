import { DEFAULT_DB_NAME, getAllStorageEntries, replaceAllStorageEntries } from './SqliteKeyValueStorage';

// Whole-database backup format for the shared kv storage (SqliteKeyValueStorage).
// Both score-tracker and geonexia persist ALL their data through that helper, so a
// dump of every key/value pair is a complete backup that survives a fresh install.

export const KV_BACKUP_FILE_TYPE = 'kv-storage-backup';
export const KV_BACKUP_FILE_VERSION = 1;

export interface KvBackupFile {
	type: typeof KV_BACKUP_FILE_TYPE;
	version: number;
	/** App identifier (e.g. 'score-tracker') - informational, not validated on import. */
	app?: string;
	dbName: string;
	exportedAt: string;
	entries: Record<string, string>;
}

/** Serializes the complete kv storage (including internal sentinel keys) as a backup JSON string. */
export async function createKvBackupJson(options?: { dbName?: string; app?: string }): Promise<string> {
	const dbName = options?.dbName ?? DEFAULT_DB_NAME;
	const backup: KvBackupFile = {
		type: KV_BACKUP_FILE_TYPE,
		version: KV_BACKUP_FILE_VERSION,
		app: options?.app,
		dbName,
		exportedAt: new Date().toISOString(),
		entries: await getAllStorageEntries(dbName),
	};
	return JSON.stringify(backup, null, '\t');
}

/**
 * Parses and validates a backup JSON string. Throws an Error when the content
 * is not a backup created by createKvBackupJson (wrong type marker, newer
 * version, or malformed entries).
 */
export function parseKvBackupJson(json: string): KvBackupFile {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json);
	} catch {
		throw new Error('Backup file is not valid JSON');
	}
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Backup file has an unexpected structure');
	}
	const candidate = parsed as Partial<KvBackupFile>;
	if (candidate.type !== KV_BACKUP_FILE_TYPE) {
		throw new Error('File is not a kv storage backup');
	}
	if (typeof candidate.version !== 'number' || candidate.version > KV_BACKUP_FILE_VERSION) {
		throw new Error(`Unsupported backup version: ${candidate.version}`);
	}
	if (typeof candidate.entries !== 'object' || candidate.entries === null || Array.isArray(candidate.entries)) {
		throw new Error('Backup file contains no entries object');
	}
	for (const [key, value] of Object.entries(candidate.entries)) {
		if (typeof value !== 'string') {
			throw new TypeError(`Backup entry "${key}" is not a string value`);
		}
	}
	return {
		type: KV_BACKUP_FILE_TYPE,
		version: candidate.version,
		app: typeof candidate.app === 'string' ? candidate.app : undefined,
		dbName: typeof candidate.dbName === 'string' ? candidate.dbName : DEFAULT_DB_NAME,
		exportedAt: typeof candidate.exportedAt === 'string' ? candidate.exportedAt : '',
		entries: candidate.entries as Record<string, string>,
	};
}

/**
 * Replaces the complete kv storage with the backup's entries and returns how
 * many entries were restored. The target dbName is the one the app runs on,
 * NOT the backup's recorded dbName - restoring a backup into the running
 * app's database is exactly the fresh-install use case.
 */
export async function restoreKvBackup(backup: KvBackupFile, dbName: string = DEFAULT_DB_NAME): Promise<number> {
	await replaceAllStorageEntries(backup.entries, dbName);
	return Object.keys(backup.entries).length;
}
