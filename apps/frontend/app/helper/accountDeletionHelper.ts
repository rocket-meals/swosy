import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { deleteProfileRemote } from '@/redux/actions/Profile/Profile';
import { clearStoredGuestAccountCredentials } from '@/helper/guestAccountHelper';

/**
 * Deletes the signed-in account on the server: the profile first, then the Directus user.
 * The User policy allows both for the own account. Deleting only the profile is not enough -
 * the user (incl. e-mail or SSO identity) would remain and profile-create-hook would give it a
 * new, empty profile within a minute.
 *
 * Profile before user: the profile permission is checked against $CURRENT_USER.profile, which
 * no longer works once the user is gone.
 *
 * Guests additionally forget their credentials on this device in any case - without them
 * nobody can sign in to the account any more, so a failed server deletion only leaves an
 * unreachable account behind instead of blocking the user.
 *
 * Returns whether the user was deleted on the server.
 */
export const deleteOwnAccount = async ({ profileId, isGuest }: { profileId: string | number | null | undefined; isGuest: boolean }): Promise<boolean> => {
	if (profileId) {
		try {
			await deleteProfileRemote(profileId);
		} catch (error) {
			console.warn('Could not delete profile on the server:', error);
		}
	}
	let userDeleted = false;
	try {
		await ServerAPI.deleteMe();
		userDeleted = true;
	} catch (error) {
		console.warn('Could not delete user on the server:', error);
	}
	if (isGuest) {
		await clearStoredGuestAccountCredentials();
	}
	return userDeleted;
};
