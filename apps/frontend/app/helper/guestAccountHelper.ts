import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GuestAccountCredentials, GuestAccountHelper } from 'repo-depkit-common';
import { getValue, removeValue, setValue } from '@/constants/AsyncStorageHelper';
import { createGuestAccountCredentials } from '@/redux/actions/ApiService/ApiService';

// The generated credentials are the only way back into a guest account. They
// intentionally survive a logout (see helper/logoutHelper.ts): "continue as
// guest" then signs in to the same guest account again instead of creating a
// new, empty one. Native keeps them in the keychain/keystore, web has no secure
// storage and falls back to the regular key/value storage.
const GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY = 'guest_account_credentials';

const isSecureStoreUsable = () => Platform.OS !== 'web';

export const getStoredGuestAccountCredentials = async (): Promise<GuestAccountCredentials | null> => {
	try {
		let storedValue: unknown;
		if (isSecureStoreUsable()) {
			const rawValue = await SecureStore.getItemAsync(GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY);
			storedValue = rawValue ? JSON.parse(rawValue) : null;
		} else {
			storedValue = await getValue(GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY);
		}
		return GuestAccountHelper.isValidCredentials(storedValue) ? storedValue : null;
	} catch (error) {
		console.error('Could not read guest account credentials:', error);
		return null;
	}
};

const storeGuestAccountCredentials = async (credentials: GuestAccountCredentials): Promise<void> => {
	if (isSecureStoreUsable()) {
		await SecureStore.setItemAsync(GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
	} else {
		await setValue(GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY, credentials);
	}
};

export const clearStoredGuestAccountCredentials = async (): Promise<void> => {
	try {
		if (isSecureStoreUsable()) {
			await SecureStore.deleteItemAsync(GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY);
		} else {
			await removeValue(GUEST_ACCOUNT_CREDENTIALS_STORAGE_KEY);
		}
	} catch (error) {
		console.error('Could not clear guest account credentials:', error);
	}
};

/** Lets the server create a new guest account and keeps its credentials on this device. */
export const createAndStoreGuestAccount = async (): Promise<GuestAccountCredentials> => {
	const credentials = await createGuestAccountCredentials();
	if (!GuestAccountHelper.isValidCredentials(credentials)) {
		throw new Error('Server returned invalid guest account credentials');
	}
	await storeGuestAccountCredentials(credentials);
	return credentials;
};
