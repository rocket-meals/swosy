/**
 * Web-specific implementation for AsyncStorage using localStorage.
 * This file is used when the app runs on the web to avoid 'window is not defined' errors.
 */

const isBrowser = typeof window !== 'undefined';

export const setValue = async (key: string, value: any): Promise<void> => {
	if (!isBrowser) {
		return;
	}
	try {
		const jsonValue = JSON.stringify(value);
		localStorage.setItem(key, jsonValue);
	} catch (error) {
		console.error(`Error setting value for key "${key}" in localStorage:`, error);
	}
};

export const getValue = async (key: string): Promise<any | null> => {
	if (!isBrowser) {
		return null;
	}
	try {
		const jsonValue = localStorage.getItem(key);
		return jsonValue != null ? JSON.parse(jsonValue) : null;
	} catch (error) {
		console.error(`Error getting value for key "${key}" from localStorage:`, error);
		return null;
	}
};

export const removeValue = async (key: string): Promise<void> => {
	if (!isBrowser) {
		return;
	}
	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.error(`Error removing value for key "${key}" from localStorage:`, error);
	}
};

export const clearStorage = async (): Promise<void> => {
	if (!isBrowser) {
		return;
	}
	try {
		localStorage.clear();
	} catch (error) {
		console.error('Error clearing localStorage:', error);
	}
};

export const multiRemove = async (keys: string[]): Promise<void> => {
	if (!isBrowser) {
		return;
	}
	try {
		keys.forEach(key => localStorage.removeItem(key));
	} catch (error) {
		console.error('Error in multiRemove from localStorage:', error);
	}
};

export const multiGet = async (keys: string[]): Promise<[string, string | null][]> => {
	if (!isBrowser) {
		return [];
	}
	try {
		return keys.map(key => [key, localStorage.getItem(key)]);
	} catch (error) {
		console.error('Error in multiGet from localStorage:', error);
		return [];
	}
};

export const multiSet = async (keyValuePairs: [string, string][]): Promise<void> => {
	if (!isBrowser) {
		return;
	}
	try {
		keyValuePairs.forEach(([key, value]) => localStorage.setItem(key, value));
	} catch (error) {
		console.error('Error in multiSet in localStorage:', error);
	}
};

export const getAllKeys = async (): Promise<string[]> => {
	if (!isBrowser) {
		return [];
	}
	try {
		return Object.keys(localStorage);
	} catch (error) {
		console.error('Error getting all keys from localStorage:', error);
		return [];
	}
};

// For redux-persist, we need to export a default object that mimics AsyncStorage
// This will be used in redux/store/store.ts
export default {
	setItem: (key: string, value: string) => setValue(key, value),
	getItem: (key: string) => getValue(key),
	removeItem: (key: string) => removeValue(key),
	clear: () => clearStorage(),
	multiRemove: (keys: string[]) => multiRemove(keys),
	multiGet: (keys: string[]) => multiGet(keys),
	multiSet: (keyValuePairs: [string, string][]) => multiSet(keyValuePairs),
	getAllKeys: () => getAllKeys(),
};
