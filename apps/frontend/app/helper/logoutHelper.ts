import { sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';
import { Dispatch } from 'redux';
import {
	CLEAR_APARTMENTS,
	CLEAR_CAMPUSES,
	CLEAR_CANTEENS,
	CLEAR_CHATS,
	CLEAR_COLLECTION_DATES_LAST_UPDATED,
	CLEAR_COLLECTIBLE_EVENTS,
	CLEAR_DEVELOPER_MODE,
	CLEAR_FOODS,
	CLEAR_FRIENDSHIPS,
	CLEAR_MANAGEMENT,
	CLEAR_NEWS,
	CLEAR_POPUP_EVENTS,
	CLEAR_POPUP_EVENTS_HASH,
	CLEAR_PROFILE,
	CLEAR_SETTINGS,
	ON_LOGOUT,
	SET_MARKING_DETAILS,
	SET_SELECTED_FOOD_MARKINGS,
	UPDATE_MARKINGS,
} from '@/redux/Types/types';
import { persistor } from '@/redux/store';
import { clearChatReadStatus } from '@/helper/chatReadStatus';
import { clearAppDownloadBannerDismissed } from '@/helper/appDownloadBannerStorage';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

// ⚠️ Reminder: this function is the single place that resets app state on logout.
// If you add a new persisted storage key - a redux slice backed by redux-persist,
// a raw AsyncStorage/sessionStorage key, anything under constants/AsyncStorageHelper.ts -
// come back here and clear it too, unless it's intentionally meant to survive a
// logout (e.g. language/theme/server selection). It's easy to add a new CLEAR_*
// action or a dedicated clearXStorage() helper (see clearChatReadStatus() and
// clearAppDownloadBannerDismissed() below for the two established patterns) and
// forget to wire it in here - the data then silently leaks into the next user's
// session on a shared/kiosk device.
export const performLogout = async (
	dispatch: Dispatch,
	router: any
) => {
	try {
		await ServerAPI.logout();
		dispatch({ type: ON_LOGOUT });
		dispatch({ type: CLEAR_CANTEENS });
		dispatch({ type: CLEAR_CAMPUSES });
		dispatch({ type: CLEAR_APARTMENTS });
		dispatch({ type: UPDATE_MARKINGS, payload: [] });
		dispatch({ type: SET_SELECTED_FOOD_MARKINGS, payload: [] });
		dispatch({ type: CLEAR_COLLECTION_DATES_LAST_UPDATED });
		dispatch({ type: SET_MARKING_DETAILS, payload: {} });
		dispatch({ type: CLEAR_FOODS });
                dispatch({ type: CLEAR_MANAGEMENT });
                dispatch({ type: CLEAR_DEVELOPER_MODE });
                dispatch({ type: CLEAR_NEWS });
                dispatch({ type: CLEAR_COLLECTIBLE_EVENTS });
                dispatch({ type: CLEAR_PROFILE });
                dispatch({ type: CLEAR_FRIENDSHIPS });
                dispatch({ type: CLEAR_CHATS });
                await clearChatReadStatus();
                clearAppDownloadBannerDismissed();
                dispatch({ type: CLEAR_SETTINGS });
		// Explicitly drop the popup events incl. their isOpen "already dismissed"
		// flags. CLEAR_FOODS above resets them too as part of wiping the whole food
		// slice, but the dismiss state must never survive a logout (next user on a
		// shared/kiosk device would inherit it), so it gets its own dedicated clear
		// right next to the matching hash reset instead of relying on that side effect.
		dispatch({ type: CLEAR_POPUP_EVENTS });
		dispatch({ type: CLEAR_POPUP_EVENTS_HASH });
		await sqliteKeyValueStorage.multiRemove(['auth_data', 'persist:root']);

		persistor.purge();
		router.replace({ pathname: '/(auth)/login', params: { logout: 'true' } });
	} catch (error) {
		console.error('Error during logout:', error);
	} finally {
		dispatch({ type: CLEAR_COLLECTION_DATES_LAST_UPDATED });
	}
};
