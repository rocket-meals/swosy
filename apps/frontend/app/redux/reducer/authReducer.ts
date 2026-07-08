import { CLEAR_ANONYMOUSLY, CLEAR_PROFILE, ON_LOGIN, ON_LOGOUT, SET_PROFILE_LOADING, UPDATE_DEVELOPER_MODE, UPDATE_LOGIN, UPDATE_MANAGEMENT, UPDATE_PRIVACY_POLICY_DATE, UPDATE_PROFILE } from '@/redux/Types/types';
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
	// True until the profile fetch triggered by this login has resolved (success or error).
	// Lets screens (e.g. onboarding) wait for a definitive answer instead of acting on
	// possibly-stale persisted profile data.
	profileLoading: true,
};

const authReducer = (state = initialState, actions: any) => {
	switch (actions.type) {
		case ON_LOGIN: {
			return {
				...state,
				user: actions.payload,
				loggedIn: true,
				profileLoading: true,
			};
		}
		case UPDATE_LOGIN: {
			return {
				...state,
				user: actions.payload,
				loggedIn: true,
				profileLoading: true,
			};
		}
		case SET_PROFILE_LOADING: {
			return {
				...state,
				profileLoading: actions.payload,
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
