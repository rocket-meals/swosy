import { CLEAR_ANONYMOUSLY, CLEAR_PROFILE, CLEAR_PROFILE_BEFORE_SESSION_EXPIRED, ON_LOGIN, ON_LOGOUT, UPDATE_DEVELOPER_MODE, UPDATE_LOGIN, UPDATE_MANAGEMENT, SESSION_EXPIRED, UPDATE_PRIVACY_POLICY_DATE, UPDATE_PROFILE } from '@/redux/Types/types';
import { PriceGroupKey } from '@/app/(app)/settings/types';

export const InitialProfile = {
	markings: [],
	price_group: PriceGroupKey.student,
	id: null,
};

const initialState = {
	user: {},
	profile: InitialProfile,
	loggedIn: false,
	isManagement: false,
	isDevMode: false,
	termsAndPrivacyConsentAcceptedDate: null,
	// Set when the server rejected the login session; the login screen then explains why.
	sessionExpired: false,
	// Local profile at the moment the session expired. Changes made while the session was
	// dead never reached the server; after logging in again they are transferred.
	profileBeforeSessionExpired: null,
};

const authReducer = (state, actions: any) => {
	state = state === undefined ? initialState : state;

	switch (actions.type) {
		case ON_LOGIN:
		case UPDATE_LOGIN: {
			return {
				...state,
				user: actions.payload,
				loggedIn: true,
				sessionExpired: false,
			};
		}
		case SESSION_EXPIRED: {
			// Keep the local profile (eating habits, canteen) - only the login is gone.
			return {
				...state,
				user: {},
				loggedIn: false,
				sessionExpired: true,
				profileBeforeSessionExpired: state.profile?.id ? state.profile : state.profileBeforeSessionExpired ?? null,
			};
		}
		case CLEAR_PROFILE_BEFORE_SESSION_EXPIRED: {
			return {
				...state,
				profileBeforeSessionExpired: null,
			};
		}
		case UPDATE_MANAGEMENT: {
			return {
				...state,
				isManagement: actions.payload,
			};
		}
		case UPDATE_DEVELOPER_MODE: {
			return {
				...state,
				isDevMode: actions.payload,
			};
		}
		case UPDATE_PROFILE: {
			return {
				...state,
				profile: actions.payload,
			};
		}
		case CLEAR_PROFILE: {
			return {
				...state,
				profile: InitialProfile,
			};
		}
		case UPDATE_PRIVACY_POLICY_DATE: {
			return {
				...state,
				termsAndPrivacyConsentAcceptedDate: actions.payload,
			};
		}
		case CLEAR_ANONYMOUSLY: {
			return {
				...initialState,
				isDevMode: state.isDevMode,
			};
		}
		case ON_LOGOUT: {
			return {
				...initialState,
			};
		}
		default:
			return state;
	}
};

export default authReducer;
