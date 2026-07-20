import { sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';

// ⚠️ Adding a new key here that stores user-specific data? Go add its removal
// to helper/logoutHelper.ts too (see the reminder comment on performLogout) -
// otherwise it silently survives a logout on shared/kiosk devices.

/**
 * Save a value to storage (sqlite on native, AsyncStorage on web - see
 * redux/storage/sqliteStorage.ts).
 *
 * @param {string} key - The key under which the value is stored.
 * @param {any} value - The value to store. It will be serialized to JSON.
 * @returns {Promise<void>}
 */
export const setValue = async (key: string, value: any): Promise<void> => {
	try {
		const jsonValue = JSON.stringify(value);
		await sqliteKeyValueStorage.setItem(key, jsonValue);
	} catch (error) {
		console.error(`Error setting value for key "${key}":`, error);
	}
};

/**
 * Retrieve a value from storage (sqlite on native, AsyncStorage on web).
 *
 * @param {string} key - The key of the value to retrieve.
 * @returns {Promise<any>} - The parsed value, or null if not found or an error occurred.
 */
export const getValue = async (key: string): Promise<any> => {
	try {
		const jsonValue = await sqliteKeyValueStorage.getItem(key);
		return jsonValue != null ? JSON.parse(jsonValue) : null;
	} catch (error) {
		console.error(`Error getting value for key "${key}":`, error);
		return null;
	}
};

/**
 * Remove a value from storage (sqlite on native, AsyncStorage on web).
 *
 * @param {string} key - The key of the value to remove.
 * @returns {Promise<void>}
 */
export const removeValue = async (key: string): Promise<void> => {
	try {
		await sqliteKeyValueStorage.removeItem(key);
	} catch (error) {
		console.error(`Error removing value for key "${key}":`, error);
	}
};

/**
 * Clear all data from storage (sqlite on native, AsyncStorage on web).
 *
 * @returns {Promise<void>}
 */
export const clearStorage = async (): Promise<void> => {
	try {
		await sqliteKeyValueStorage.clear();
	} catch (error) {
		console.error('Error clearing storage:', error);
	}
};
