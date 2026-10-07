import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { DatabaseTypes } from 'repo-depkit-common';
import { useAppSelector } from '@/redux/hooks';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { SESSION_EXPIRED } from '@/redux/Types/types';
import { updateLoginStatus } from '@/constants/HelperFunctions';
import { UserHelper } from '@/helper/UserHelper';
import { afterRehydration } from '@/helper/afterRehydration';
import { getStoredGuestAccountCredentials } from '@/helper/guestAccountHelper';

/**
 * Detects a login session the server no longer accepts and reacts to it, instead of letting
 * the app continue silently as the public role (which made profile changes vanish).
 *
 * - On app start the session is checked once with `getMe()`. Offline/server errors are
 *   ignored, so users without network are never logged out.
 * - At runtime ServerAPI reports a rejected token refresh or a profile read as the public role.
 *
 * Guests get signed in again silently with the credentials stored on the device. Everyone else
 * is sent to the login screen with a hint; the local profile is kept and transferred to the
 * server after logging in again (see fetchProfile in app/(app)/_layout.tsx).
 */
export default function useAuthSessionGuard() {
	const dispatch = useDispatch();
	const user = useAppSelector((state) => state.authReducer.user) as DatabaseTypes.DirectusUsers | undefined;
	const isRegisteredUser = UserHelper.isRegisteredUser(user ?? null);
	const userId = user?.id;
	const handlingRef = useRef(false);

	const reLoginAsGuest = useCallback(async (expectedUserId: string): Promise<boolean> => {
		const credentials = await getStoredGuestAccountCredentials();
		if (!credentials) return false;
		try {
			await ServerAPI.authenticateWithEmailAndPassword(credentials.email, credentials.password);
			const me = (await ServerAPI.getMe()) as DatabaseTypes.DirectusUsers;
			if (me?.id === expectedUserId) {
				updateLoginStatus(dispatch, me);
				return true;
			}
			// The stored guest credentials belong to another account - do not switch identity.
			await ServerAPI.clearSession();
		} catch (error) {
			console.error('Silent guest re-login failed:', error);
		}
		return false;
	}, [dispatch]);

	const handleInvalidSession = useCallback(async () => {
		if (!userId || handlingRef.current) return;
		handlingRef.current = true;
		try {
			if (await reLoginAsGuest(userId)) return;
			dispatch({ type: SESSION_EXPIRED });
		} finally {
			handlingRef.current = false;
		}
	}, [userId, reLoginAsGuest, dispatch]);

	useEffect(() => {
		if (!isRegisteredUser) return;
		return ServerAPI.onSessionInvalid(() => {
			handleInvalidSession();
		});
	}, [isRegisteredUser, handleInvalidSession]);

	useEffect(() => {
		if (!isRegisteredUser) return;
		let cancelled = false;
		const unsubscribe = afterRehydration(() => {
			ServerAPI.validateSession().then(result => {
				if (cancelled) return;
				if (result.status === 'invalid') {
					handleInvalidSession();
				} else if (result.status === 'valid' && result.user.id !== userId) {
					// The session belongs to someone else than the stored user - treat as expired.
					handleInvalidSession();
				}
			});
		});
		return () => {
			cancelled = true;
			unsubscribe();
		};
		// Only once per logged-in user, not on every user object update.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isRegisteredUser, userId]);
}
