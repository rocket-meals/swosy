import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { GuestAccountCredentials, GuestAccountHelper } from 'repo-depkit-common';
import { getValue, removeValue, setValue } from '@/constants/AsyncStorageHelper';
import { createGuestAccountCredentials } from '@/redux/actions/ApiService/ApiService';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { deleteProfileRemote } from '@/redux/actions/Profile/Profile';

// The generated credentials are the only way back into a guest account. A guest
// cannot log out and come back: "logging out" as a guest deletes the account
// (deleteGuestAccountAndCredentials below). Until then the credentials stay on
// the device - on iOS the keychain even keeps them across a reinstall, so the
// guest gets the same account back. Native keeps them in the keychain/keystore,
// web has no secure storage and falls back to the regular key/value storage.
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

/**
 * What "log out" means for a guest: delete the account on the server - profile first,
 * then the user (the User policy allows both for the own account) - and in any case
 * forget the credentials on this device. Without them nobody can sign in to the account
 * any more, so a failed server deletion only leaves an unreachable account behind
 * instead of blocking the user.
 */
export const deleteGuestAccountAndCredentials = async (profileId: string | number | null | undefined): Promise<void> => {
	if (profileId) {
		try {
			await deleteProfileRemote(profileId);
		} catch (error) {
			console.warn('Could not delete guest profile on the server:', error);
		}
	}
	try {
		await ServerAPI.deleteMe();
	} catch (error) {
		console.warn('Could not delete guest user on the server:', error);
	}
	await clearStoredGuestAccountCredentials();
};
